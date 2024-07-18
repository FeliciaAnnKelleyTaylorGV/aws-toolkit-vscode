/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as nls from 'vscode-nls'
import * as vscode from 'vscode'
import { ExtContext } from '../../shared'
import { VueWebview } from '../../webviews/main'
import { getLogger, Logger } from '../../shared/logger'
import { telemetry } from '../../shared/telemetry/telemetry'
import { DynamoDbTableNode } from '../explorer/dynamoDbTableNode'
import { DynamoDbClient } from '../../shared/clients/dynamoDbClient'
import { DynamoDB } from 'aws-sdk'

const localize = nls.loadMessageBundle()

interface DynamoDbTableData {
    TableName: string
    VersionPrefix: string
    TableItems: string[]
    Region: string
}

export class DynamoDbTableWebview extends VueWebview {
    public static readonly sourcePath: string = 'src/dynamoDb/vue/index.js'
    public readonly id = 'dynamoDbTableView'

    public constructor(
        // private readonly channel: vscode.OutputChannel,
        // private readonly client: DynamoDbClient,
        private readonly data: DynamoDbTableData
    ) {
        super(DynamoDbTableWebview.sourcePath)
    }

    public init() {
        telemetry.schemas_view.emit({ result: 'Succeeded' })
        return this.data
    }
}

const Panel = VueWebview.compilePanel(DynamoDbTableWebview)

export async function viewDynamoDbTable(context: ExtContext, node: DynamoDbTableNode) {
    const logger: Logger = getLogger()

    try {
        const client = new DynamoDbClient(node.regionCode)
        const tableItems = await client.scanTable({ TableName: node.dynamoDbtable })
        if (tableItems.Count === 0) {
            void vscode.window.showInformationMessage(localize('AWS.dynamoDb.viewTable.items', 'No Items to display'))
            return
        }
        const wv = new Panel(context.extensionContext, {
            TableName: node.dynamoDbtable,
            VersionPrefix: new Date().toLocaleString(),
            TableItems: convertItemstoStringArray(tableItems),
            Region: node.regionCode,
        })
        await wv.show({
            title: localize('AWS.dynamoDb.viewTable.title', node.dynamoDbtable),
            cssFiles: ['searchSchemas.css'],
        })
    } catch (err) {
        const error = err as Error
        logger.error('Error loading the table: %s', error)
    }
}

export function convertItemstoStringArray(items: DynamoDB.Types.ScanOutput) {
    const tableItems = []
    for (const item of items.Items ?? []) {
        tableItems.push(`${JSON.stringify(item)}`)
    }
    return tableItems
}
