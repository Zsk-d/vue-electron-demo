<template>
    <div style="padding: 5px;">
        <a-list size="small" bordered :data-source="params" :locale="{ emptyText: '无字段数据' }">
            <template #renderItem="{ item, index }">
                <a-list-item v-if="type == 'send' || !(name.startsWith('H') && config.config.resDataType == 'text')">
                    <template #actions>
                        <arrow-up-outlined @click="changeIndex(item.name, -1)" v-if="params.length > 1 && index > 0"
                            class="item-icon up-item-icon" />
                        <arrow-down-outlined @click="changeIndex(item.name, 1)"
                            v-if="params.length > 1 && index < params.length - 1" class="item-icon down-item-icon" />
                        <close-circle-outlined class="item-icon del-item-icon" @click="del(item.name)" />
                    </template>
                    <div>
                        <a-row>
                            <h3 style="font-weight:bold">{{ `${index}. ${item.name}` }}</h3>
                            <a-textarea :auto-size="{ minRows: 1 }" v-model:value="item.value"
                                :readOnly="type == 'recv'" @blur="valueBulr(item.name, item.value)"
                                :allowClear="type != 'recv'"
                                :maxlength="type == 'send' && item.type == 'str' ? parseInt(item.length) : null"
                                :showCount="type == 'send' && item.type == 'str' && !name.startsWith('H')"
                                :type="item.type == 'str' ? 'text' : 'number'">
                            </a-textarea>
                        </a-row>
                        <a-row>
                            <a-space>
                                <label>{{ { "str": "字符串", "int32": "int32", "byte": "byte" }[item.type] }}</label>
                                <label v-if="!name.startsWith('H')">{{ item.length + '字节' }}</label>
                                <label v-if="item.type == 'str' && item.lengthType == 'DC' && !name.startsWith('H')">{{ {
                                        "left": "左填", "right":
                                            "右填", "": "右填"
                                    }[item.fill] +
                                        `0x${item.fillValue ? item.fillValue : 0}`
                                }}</label>
                                <label v-if="item.type == 'int32'">{{ item.loc == 'big' ? '大端' : '小端' }}</label>
                            </a-space>
                        </a-row>
                    </div>
                </a-list-item>
                <a-list-item v-else>
                    <div>
                        <a-row>
                            <a-textarea :auto-size="{ minRows: 2 }" v-model:value="item.value"  style="width:412px"
                                :readOnly="type == 'recv'" @blur="valueBulr(item.name, item.value)"
                                :allowClear="type != 'recv'"
                                :maxlength="type == 'send' && item.type == 'str' ? parseInt(item.length) : null"
                                :showCount="type == 'send' && item.type == 'str' && !name.startsWith('H')"
                                :type="item.type == 'str' ? 'text' : 'number'">
                            </a-textarea>
                        </a-row>
                    </div>
                </a-list-item>
            </template>
            <!-- 添加字段面板 -->
            <a-collapse :bordered="false" v-if="type == 'send' || !(name.startsWith('H') && config.config.resDataType == 'text')">
                <a-collapse-panel header="添加字段" :style="{ border: 0 }">
                    <a-form>
                        <a-form-item label="字段名">
                            <a-input style="width:200px" :allowClear="true" v-model:value="param.name">
                            </a-input>
                        </a-form-item>
                        <a-form-item label="字段类型">
                            <a-radio-group v-model:value="param.type" button-style="solid" @change="paramTypeChange">
                                <a-radio-button value="str">字符串</a-radio-button>
                                <a-radio-button v-if="name.startsWith('H') && type == 'recv'" value="object">对象</a-radio-button>
                                <a-radio-button v-if="!name.startsWith('H')" value="byte">byte</a-radio-button>
                                <a-radio-button v-if="!name.startsWith('H')" value="int32">int32</a-radio-button>
                            </a-radio-group>
                        </a-form-item>
                        <a-form-item label="长度类型" v-if="param.type == 'str' && type == 'send' && !name.startsWith('H')">
                            <a-radio-group v-model:value="param.lengthType" button-style="solid">
                                <a-radio-button value="DC">定长</a-radio-button>
                                <a-radio-button value="ZD">自动</a-radio-button>
                            </a-radio-group>
                        </a-form-item>
                        <a-form-item label="长度/字节" v-if="param.type == 'str' && param.lengthType == 'DC' && !name.startsWith('H')">
                            <a-input style="width:200px" type="number" :allowClear="true" v-model:value="param.length">
                            </a-input>
                        </a-form-item>
                        <a-form-item label="填充方向" v-if="param.type == 'str' && param.lengthType == 'DC' && !name.startsWith('H')">
                            <a-radio-group v-model:value="param.fill" button-style="solid">
                                <a-radio-button value="">默认右填0x0</a-radio-button>
                                <a-radio-button value="right">右填</a-radio-button>
                                <a-radio-button value="left">左填</a-radio-button>
                            </a-radio-group>
                        </a-form-item>
                        <a-form-item label="端" v-if="param.type == 'int32'">
                            <a-radio-group v-model:value="param.loc" button-style="solid">
                                <a-radio-button value="big">大端</a-radio-button>
                                <a-radio-button value="small">小端</a-radio-button>
                            </a-radio-group>
                        </a-form-item>
                        <a-form-item label="填充值(16进制ascii)"
                            v-if="param.type == 'str' && param.fill != '' && param.lengthType == 'DC'">
                            <a-input :addon-before="'0x'" :allowClear="true" v-model:value="param.fillValue"
                                type="number" style="width:150px"></a-input>
                        </a-form-item>
                        <a-form-item v-if="type == 'send'" :label="'初始值' + (param.type != 'str' ? '(十进制)' : '')">
                            <a-input style="width:200px"
                                :disabled="param.type == 'str' && param.lengthType == 'DC' && !param.length && !name.startsWith('H')"
                                :type="param.type == 'str' ? 'text' : 'number'" :show-count="!name.startsWith('H')"
                                :maxlength="param.type == 'str' ? parseInt(param.length) : null" :allowClear="true"
                                v-model:value="param.value">
                            </a-input>
                        </a-form-item>
                        <a-form-item>
                            <a-button type="primary" @click="addParam">添加</a-button>
                        </a-form-item>
                    </a-form>
                </a-collapse-panel>
            </a-collapse>
        </a-list>
    </div>
</template>
<script>
import { CloseCircleOutlined, ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons-vue';
export default {
    data() { return { param: { type: "str", fill: "", loc: "big", lengthType: "DC" } } },
    mounted() {
        // console.log(this.config)
        if(this.config.name.startsWith('HC') && this.config.config.resDataType == 'text' && this.type == 'recv'){
            this.addParamModalOk(this.name, {name:'res', value: ''}, this.type);
        }
     },
    props: ["type", "params", "name", "addParamModalOk", "changeValue", "isXs", "delParam", "changeParamIndex", "config"],
    components: { CloseCircleOutlined, ArrowDownOutlined, ArrowUpOutlined },
    methods: {
        itemChange(item) {
            item.isChanged = true;
        }, paramTypeChange() {
            this.param.type == 'int32' ? this.param.length = 4 : this.param.type == 'byte' ? this.param.length = 1 : "";
        }, addParam() {
            this.addParamModalOk(this.name, this.param, this.type);
        }, valueBulr(paramName, paramValue) {
            this.changeValue(this.name, this.type, paramName, paramValue);
        }, del(paramName) {
            this.delParam(this.name, this.type, paramName);
        }, changeIndex(paramName, value) {
            this.changeParamIndex(this.name, this.type, paramName, value);
        }
    }
}
</script>
<style>
.item-icon svg {
    font-size: 18px;
    transition: opacity 0.3s;
    cursor: pointer;
    opacity: 0.2;
}

.up-item-icon.down-item-icon svg {
    color: #3d2128;
}

.del-item-icon svg {
    color: #ff1d5b;
}

.item-icon svg:hover {
    opacity: 1;
}
</style>