/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode'
import { Commands } from '../shared/vscode/commands2'
import { searchDynamoDbTables } from './commands/searchDynamoDbTables'
import { DynamoDbTableNode } from './explorer/dynamoDbTableNode'
import { DynamoDbInstanceNode } from './explorer/dynamoDbInstanceNode'

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    context.subscriptions.push(
        Commands.register(
            'aws.dynamoDb.searchDynamoDbTables',
            async (node: DynamoDbTableNode | DynamoDbInstanceNode) => {
                const dynamoDbtableInfo =
                    node instanceof DynamoDbTableNode
                        ? { regionName: node.regionCode, groupName: node.regionCode! }
                        : undefined
                const source = node
                    ? dynamoDbtableInfo
                        ? 'ExplorerDynamoDbTableNode'
                        : 'ExplorerServiceNode'
                    : 'Command'
                await searchDynamoDbTables(source, dynamoDbtableInfo)
            }
        )
    )
}
