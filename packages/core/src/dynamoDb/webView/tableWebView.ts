/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode'
import { DynamoDB } from 'aws-sdk'
import { ExtContext } from '../../shared'
import { AttributeValue } from 'aws-sdk/clients/dynamodb'
import { DynamoDbTableNode } from '../explorer/dynamoDbTableNode'
import { DynamoDbClient } from '../../shared/clients/dynamoDbClient'

export async function viewDynamoDbTable(
    context: ExtContext,
    node: DynamoDbTableNode,
    client = new DynamoDbClient(node.regionCode)
) {
    const panel = vscode.window.createWebviewPanel('dynamoDBItems', node.dynamoDbtable, vscode.ViewColumn.One, {
        enableScripts: true,
    })

    try {
        const items = await client.scanTable({ TableName: node.dynamoDbtable })
        const tableColumnsNames = getTableColumnsNames(items)
        const tableItems = getTableItems(tableColumnsNames, items)
        panel.webview.html = getWebviewContent(node.dynamoDbtable, tableColumnsNames, tableItems)
    } catch (error) {
        panel.webview.html = `<h1>Error fetching DynamoDB items</h1><p>${error}</p>`
    }
}

function getTableColumnsNames(items: DynamoDB.Types.ScanOutput) {
    const tableColumnsNames = new Set<string>()
    for (const item of items.Items ?? []) {
        for (const key of Object.keys(item)) {
            tableColumnsNames.add(key)
        }
    }
    return tableColumnsNames
}

function getTableItems(tableColumnsNames: Set<string>, items: DynamoDB.Types.ScanOutput) {
    const tableItems = []
    for (const item of items.Items ?? []) {
        const curItem = []
        for (const columnName of tableColumnsNames) {
            const columnValue = item[columnName] || undefined
            if (columnValue === undefined) {
                curItem.push('')
            } else {
                const attributeValue = getAttributeValue(columnValue)
                curItem.push(attributeValue?.value)
            }
        }
        tableItems.push(curItem)
    }
    return tableItems
}

function getAttributeValue(attribute: AttributeValue): { key: string; value: any } | undefined {
    const keys = Object.keys(attribute) as (keyof AttributeValue)[]
    for (const key of keys) {
        if (attribute[key] !== undefined) {
            return { key, value: attribute[key] }
        }
    }
    return undefined
}

function getWebviewContent(tableName: string, tableColumnsNames: Set<string>, items: string[][]): string {
    const tableRows = items
        .map(item => {
            const columns = item.map(value => `<td>${value}</td>`).join('')
            return `<tr>${columns}</tr>`
        })
        .join('')

    const lastRefreshed = new Date().toLocaleString()

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
               @import '../vue/tableView.css';
            </style>
            <!-- Include VS Code Webview UI Toolkit CSS (if needed) -->
            <link rel="stylesheet" href="path/to/vscode-webview-ui-toolkit.css">
        </head>
        <body>
            <h1>${tableName}</h1>
            <h3>${'Last refreshed on : ' + lastRefreshed}</h3>
            <button>Scan</button>
            <span class="codicon codicon-check"></span>
            <table>
                <thead>
                    <tr>${Array.from(tableColumnsNames)
                        .map(key => `<th>${key}</th>`)
                        .join('')}</tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            </body>
        </html>
    `
}
