<!-- <template>
    <div>
        <div>
            <table>
                <tr>
                    <th id="tableName" rowspan="2">{{ dynamoDbTableData.TableName }}</th>
                    <td id="tableMetadata">{{ 'Last refreshed on : ' + dynamoDbTableData.VersionPrefix }}</td>
                </tr>
                <tr>
                    <td id="tableMetadata"><button>Scan</button></td>
                </tr>
            </table>
        </div>
        <div>
            <table>
                <thead>
                    <tr>
                        <th id="tableHeaders" v-for="(value, key) in dynamoDbTableData.TableItems[0]">
                            {{ key }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="tableItem of dynamoDbTableData.TableItems">
                        <td v-for="(value, key) in tableItem">
                            {{ getItemValue(value) }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { DynamoDbTableWebview } from './tableView'
import { WebviewClientFactory } from '../../webviews/client'

const client = WebviewClientFactory.create<DynamoDbTableWebview>()

export default defineComponent({
    data() {
        return {
            dynamoDbTableData: {
                TableName: '',
                VersionPrefix: '',
                TableItems: [] as string[],
                Region: '',
            },
        }
    },
    async created() {
        this.dynamoDbTableData = (await client.init()) ?? this.dynamoDbTableData
        const tableHeaders = []
        for (const x of this.dynamoDbTableData.TableItems) {
            tableHeaders.push(JSON.parse(x))
        }
        this.dynamoDbTableData.TableItems = tableHeaders
    },
    methods: {
        getItemValue(value: any) {
            try {
                return Object.values(value)[0]
                // return value.S
            } catch (e) {
                return value
            }
        },
    },
})
</script>

<style scoped>
table {
    width: 100%;
    border-collapse: collapse;
}

th,
td {
    padding: 8px;
    border-color: aqua;
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 10px;
    padding-right: 10px;
}

th {
    text-align: left;
}

th {
    border-bottom: 1px solid #ddd;
    border-top: 1px solid #ddd;
}

th,
td {
    border-left: 1px solid #ddd;
    border-right: 1px solid #ddd;
}
tr:last-child {
    border-bottom: 1px solid #ddd;
}

tr:hover {
    background-color: #3b4f74;
}

#tableMetadata {
    text-align: right;
    border: none;
}

#tableName {
    font-size: 24px;
    text-align: left;
    border: none;
}

#tableHeaders {
    font-weight: bolder;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}
</style> -->

<template>
    <div>
        <vscode-data-grid aria-label="Basic">
            <vscode-data-grid-row row-type="header">
                <vscode-data-grid-cell cell-type="columnheader" grid-column="1">Header 1</vscode-data-grid-cell>
                <vscode-data-grid-cell cell-type="columnheader" grid-column="2">Header 2</vscode-data-grid-cell>
                <vscode-data-grid-cell cell-type="columnheader" grid-column="3">Header 3</vscode-data-grid-cell>
                <vscode-data-grid-cell cell-type="columnheader" grid-column="4">Header 4</vscode-data-grid-cell>
            </vscode-data-grid-row>
            <vscode-data-grid-row>
                <vscode-data-grid-cell grid-column="1">Cell Data</vscode-data-grid-cell>
                <vscode-data-grid-cell grid-column="2">Cell Data</vscode-data-grid-cell>
                <vscode-data-grid-cell grid-column="3">Cell Data</vscode-data-grid-cell>
                <vscode-data-grid-cell grid-column="4">Cell Data</vscode-data-grid-cell>
            </vscode-data-grid-row>
            <vscode-data-grid-row>
                <vscode-data-grid-cell grid-column="1">Cell Data</vscode-data-grid-cell>
                <vscode-data-grid-cell grid-column="2">Cell Data</vscode-data-grid-cell>
                <vscode-data-grid-cell grid-column="3">Cell Data</vscode-data-grid-cell>
                <vscode-data-grid-cell grid-column="4">Cell Data</vscode-data-grid-cell>
            </vscode-data-grid-row>
            <vscode-data-grid-row>
                <vscode-data-grid-cell grid-column="1">Cell Data</vscode-data-grid-cell>
                <vscode-data-grid-cell grid-column="2">Cell Data</vscode-data-grid-cell>
                <vscode-data-grid-cell grid-column="3">Cell Data</vscode-data-grid-cell>
                <vscode-data-grid-cell grid-column="4">Cell Data</vscode-data-grid-cell>
            </vscode-data-grid-row>
        </vscode-data-grid>
    </div>
</template>

<!-- <template>
    <div class="header">
        <div class="header-left">
            <h1>{{ dynamoDbTableData.TableName }}</h1>
        </div>
        <div class="header-right">
            <button>Refresh</button>
            <vscode-button>I am the new guy</vscode-button>
        </div>
        <div class="content">
            <div class = "table-container">
            <table>
            <thead>
                <tr>
                <th v-for="(value, key) in dynamoDbTableData.TableItems[0]">
                    {{ key }}
                </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="tableItem of dynamoDbTableData.TableItems">
                <td v-for="(value, key) in tableItem">
                    {{ getItemValue(value) }}
                </td>
                </tr>
            </tbody>
            </table>
            </div>
        </div>
    </div>
</template> -->

<script setup lang="ts">
import { allComponents, provideVSCodeDesignSystem } from '@vscode/webview-ui-toolkit'

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
// provideVSCodeDesignSystem().register(vsCodeButton());

// To register more toolkit components, simply import the component
// registration function and call it from within the register
// function, like so:
//
// provideVSCodeDesignSystem().register(
//   vsCodeButton(),
//   vsCodeCheckbox()
// );
//
// Finally, if you would like to register all of the toolkit
// components at once, there's a handy convenience function:
//
provideVSCodeDesignSystem().register(allComponents)
</script>

<script lang="ts">
import { defineComponent } from 'vue'
import { DynamoDbTableWebview } from './tableView'
import { WebviewClientFactory } from '../../webviews/client'

const client = WebviewClientFactory.create<DynamoDbTableWebview>()

export default defineComponent({
    data() {
        return {
            dynamoDbTableData: {
                TableName: '',
                VersionPrefix: '',
                TableItems: [] as string[],
                Region: '',
            },
        }
    },
    async created() {
        this.dynamoDbTableData = (await client.init()) ?? this.dynamoDbTableData
        const tableHeaders = []
        for (const x of this.dynamoDbTableData.TableItems) {
            tableHeaders.push(JSON.parse(x))
        }
        this.dynamoDbTableData.TableItems = tableHeaders
    },
    methods: {
        getItemValue(value: any) {
            try {
                return Object.values(value)[0]
                // return value.S
            } catch (e) {
                return value
            }
        },
    },
})
</script>

<!-- <style>
@import './tableView.css';
</style>
   -->
