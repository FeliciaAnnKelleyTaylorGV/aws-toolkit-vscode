/*!
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode'
import { CawsClient, CawsDevEnv, cawsRegion, ConnectedCawsClient, CawsResource } from '../shared/clients/cawsClient'
import globals from '../shared/extensionGlobals'
import { showViewLogsMessage } from '../shared/utilities/messages'
import { LoginWizard } from './wizards/login'
import { selectCawsResource } from './wizards/selectResource'
import * as nls from 'vscode-nls'
import { getLogger } from '../shared/logger'
import * as mdeModel from '../mde/mdeModel'
import { openCawsUrl } from './utils'
import { CawsAuthenticationProvider } from './auth'
import { createCawsSessionProvider, getHostNameFromEnv } from './model'

const localize = nls.loadMessageBundle()

type LoginResult = 'Succeeded' | 'Cancelled' | 'Failed'

export async function login(authProvider: CawsAuthenticationProvider, client: CawsClient): Promise<LoginResult> {
    // TODO: add telemetry
    const wizard = new LoginWizard(authProvider)
    const lastSession = authProvider.listSessions()[0]
    const response = await wizard.run()

    if (!response) {
        return 'Cancelled'
    }

    try {
        const { accountDetails, accessDetails } = response.session
        await client.setCredentials(accessDetails, accountDetails.id)

        if (lastSession) {
            authProvider.deleteSession(lastSession)
        }

        return 'Succeeded'
    } catch (err) {
        getLogger().error('CAWS: failed to login: %O', err)
        return 'Failed'
    }
}

export async function autoConnect(authProvider: CawsAuthenticationProvider): Promise<boolean> {
    for (const account of authProvider.listAccounts()) {
        getLogger().info(`CAWS: trying to auto-connect with user: ${account.label}`)

        try {
            await authProvider.createSession(account)
            getLogger().info(`CAWS: auto-connected with user: ${account.label}`)

            return true
        } catch (err) {
            getLogger().debug(`CAWS: unable to auto-connect with user "${account.label}": %O`, err)
        }
    }

    return false
}

export async function logout(authProvider: CawsAuthenticationProvider): Promise<void> {
    const session = authProvider.listSessions()[0]

    if (session) {
        return authProvider.deleteSession(session)
    }
}

/** "List CODE.AWS Commands" command. */
export async function listCommands(): Promise<void> {
    // TODO: add telemetry
    vscode.commands.executeCommand('workbench.action.quickOpen', '> CODE.AWS')
}

type CawsCommand<T extends any[], U> = (client: ConnectedCawsClient, ...args: T) => U | Promise<U>
export type TryCommandDecorator = {
    <T extends any[], U>(command: CawsCommand<T, U>): (...args: T) => Promise<U | undefined>
}

/**
 * Creates a new decorator for a command, attempting to login prior to execution
 *
 * Can be used to inject context/dependencies later
 */
export function createCommandDecorator(
    authProvider: CawsAuthenticationProvider,
    clientFactory: () => Promise<CawsClient>
): TryCommandDecorator {
    return command => {
        type Args = typeof command extends CawsCommand<infer T, infer _> ? T : never

        return async (...args: Args) => {
            const client = await clientFactory()

            if (!client.connected) {
                const result = await login(authProvider, client)

                if (result === 'Succeeded' && client.connected) {
                    return command(client, ...args)
                }

                if (result === 'Failed') {
                    globals.window.showErrorMessage('AWS: Not connected to CODE.AWS')
                }

                return
            }

            return command(client, ...args)
        }
    }
}

/** "Clone CODE.AWS Repository" command. */
export async function cloneCawsRepo(client: ConnectedCawsClient, url?: vscode.Uri): Promise<void> {
    // TODO: add telemetry
    if (!url) {
        const r = await selectCawsResource(client, 'repo')
        if (!r) {
            return
        }
        const cloneLink = await client.toCawsGitUri(r.org.name, r.project.name, r.name)
        await vscode.commands.executeCommand('git.clone', cloneLink)
    } else {
        const [_, org, repo, project] = url.path.slice(1).split('/')
        if (!project) {
            throw new Error(`CAWS URL is invalid, project was undefined: ${url.path}`)
        }

        await vscode.commands.executeCommand('git.clone', await client.toCawsGitUri(org, repo, project))
    }
}

/** "Create CODE.AWS Development Environment" (MDE) command. */
export async function createDevEnv(client: ConnectedCawsClient): Promise<void> {
    // TODO: add telemetry
    const repo = await selectCawsResource(client, 'repo')
    const projectName = repo?.project.name
    const organizationName = repo?.org.name

    if (!projectName || !organizationName) {
        return
    }

    const args = {
        organizationName,
        projectName,
        ideRuntimes: ['VSCode'],
        repositories: [
            {
                projectName,
                repositoryName: repo.name,
                branchName: repo.defaultBranch,
            },
        ],
    }
    const env = await client.createDevEnv(args)
    try {
        await client.startEnvironmentWithProgress(
            {
                developmentWorkspaceId: env.developmentWorkspaceId,
                ...args,
            },
            'RUNNING'
        )
    } catch (err) {
        showViewLogsMessage(
            localize(
                'AWS.command.caws.createDevEnv.failed',
                'Failed to create CODE.AWS development environment in "{0}": {1}',
                projectName,
                (err as Error).message
            )
        )
    }
}

export async function openDevEnv(client: ConnectedCawsClient, env: CawsDevEnv): Promise<void> {
    const runningEnv = await client.startEnvironmentWithProgress(
        {
            developmentWorkspaceId: env.developmentWorkspaceId,
            organizationName: env.org.name,
            projectName: env.project.name,
        },
        'RUNNING'
    )
    if (!runningEnv) {
        getLogger().error('openDevEnv: failed to start environment: %s', env.developmentWorkspaceId)
        return
    }

    const deps = await mdeModel.ensureDependencies()
    if (!deps) {
        return
    }

    const provider = createCawsSessionProvider(client, cawsRegion, deps.ssm, deps.ssh)
    const SessionProcess = mdeModel.createBoundProcess(provider, env).extend({
        onStdout(stdout) {
            getLogger().verbose(`CAWS connect: ${env.id}: ${stdout}`)
        },
        onStderr(stderr) {
            getLogger().verbose(`CAWS connect: ${env.id}: ${stderr}`)
        },
        rejectOnErrorCode: true,
    })

    await mdeModel.startVscodeRemote(SessionProcess, getHostNameFromEnv(env), '/projects', deps.ssh, deps.vsc)
}

/**
 * Implements commands:
 * - "Open CODE.AWS Organization"
 * - "Open CODE.AWS Project"
 * - "Open CODE.AWS Repository"
 */
export async function openCawsResource(client: ConnectedCawsClient, kind: CawsResource['type']): Promise<void> {
    // TODO: add telemetry
    const resource = await selectCawsResource(client, kind)

    if (!resource) {
        return
    }

    if (resource.type !== 'env') {
        openCawsUrl(resource)
        return
    }

    try {
        await openDevEnv(client, resource)
    } catch (err) {
        showViewLogsMessage(
            localize(
                'AWS.command.caws.createDevEnv.failed',
                'Failed to start CODE.AWS development environment "{0}": {1}',
                resource.developmentWorkspaceId,
                (err as Error).message
            )
        )
    }
}
