<template>
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
</style>
