<template>
  <a-spin tip="配置加载中..." :spinning="spinning1 || spinning2">
    <div id="parent-div">
      <a-row>
        <a-form layout="inline" :model="config">
          <a-form-item label="● 控制台地址">
            <a-input v-model:value="config.server"></a-input>
          </a-form-item>
          <a-form-item>
            <a-button @click="connectServer" type="primary">连接</a-button>
          </a-form-item>
          <a-form-item>
            <a-button @click="config.addItemModalShow = true" type="primary">新建</a-button>
          </a-form-item>
        </a-form>
      </a-row>
      <br>
      <a-row :gutter="1">
        <a-col :xs="24" :xl="12" v-for="(item) in items" :key="item.name">
          <a-card size="small" :title="item.name" :headStyle="{backgroundColor: '#c8d5db'}">
            <template #extra>
              <template v-if="item.type.startsWith('H')">
                <label>{{ item.config.method }} [↑ {{ item.config.sendDataType }}] [↓ {{ item.config.resDataType }}]</label>
                <a-divider type="vertical" />
              </template>
              <label>{{ { 'SD': '手动', 'JG': '间隔', 'CF': '触发' }[item.sendType]
              }}</label>
              <a-divider v-if="!item.type.startsWith('H')" type="vertical" />
              <label v-if="!item.type.startsWith('H')">接收类型: {{ { 'DC': '定长', 'JSF': '结束符' }[item.config.recvType] }}</label>
              <a-divider type="vertical" />
              <label :style="{ 'color': item.comStatus == 1 ? 'green' : 'black' }" v-if="item.type.startsWith('TS')">{{
                  "客户端: "
                  + (item.comStatus == 1 ? "已连接" : "未连接")
              }}</label>
              <a-divider type="vertical" v-if="item.type.startsWith('TS')" />
              <label :style="{ 'color': item.comStatus == 1 ? 'green' : 'black' }" v-if="item.type.startsWith('TC')">{{
                  "服务器["
                  + item.comServer + "]: " + (item.comStatus == 1 ? "已连接"
                    : "未连接")
              }}</label>
              <label :style="{ 'color': item.comStatus == 1 ? 'green' : 'black' }" v-if="!item.type.startsWith('H') && item.type.startsWith('UC')">{{
                  "服务器[" + item.comServer + "]"}}</label>
              <label v-if="item.type.startsWith('HC')" :style="{ 'color': item.comStatus == 1 ? 'green' : 'black' }">{{ item.comServer.slice(item.comServer.lastIndexOf("/"))}}</label>
              <label :style="{ 'color': item.listenStatus == 1 ? 'green' : 'black' }" v-if="item.type.endsWith('S')">{{
                  "端口[" + item.port + "]: " + (item.listenStatus == 1 ? "已监听"
                    : "未监听")
              }}</label>
              <a-divider type="vertical" v-if="item.type == 'TC'" />
              <a-button size="small" v-if="item.type == 'TC' && item.comStatus != 1"
                @click="sendClientMsg(item.name, 'connect')">连接
              </a-button>
              <a-button size="small" v-if="item.type == 'TC' && item.comStatus == 1"
                @click="sendClientMsg(item.name, 'disconnect')">断开
              </a-button>
              <a-divider type="vertical" v-if="item.type.endsWith('S')" />
              <a-button size="small" v-if="item.type.endsWith('S') && item.listenStatus != 1"
                @click="sendClientMsg(item.name, 'listen')">
                监听
              </a-button>
              <a-button size="small" v-if="item.type.endsWith('S') && item.listenStatus == 1"
                @click="sendClientMsg(item.name, 'stopListen')">停止监听
              </a-button>
              <a-divider type="vertical" />
            <a-popover v-model:visible="item.actionBtnVisible" title="操作" trigger="click">
              <template #content>
                <a-button class="action-btn" size="small" @click="item.hidden = !item.hidden">{{ item.hidden?'展开':'折叠' }}</a-button>
                <a-button class="action-btn" size="small" @click="item.actionBtnVisible = false;">编辑</a-button>
                <a-button class="action-btn" size="small" @click="item.actionBtnVisible = false;">复制</a-button>
                <a-button class="action-btn" size="small" @click="item.actionBtnVisible = false;delItem(item.name)" danger>删除</a-button>
              </template>
              <more-outlined style="cursor: pointer;"/>
            </a-popover>
            </template>
            <a-row v-show="item.hidden != undefined && !item.hidden">
              <a-col :xs="24" :sm="!(item.type == 'UC')?24:12" v-if="!(item.type == 'UC')">
                <a-space><label>{{item.type.startsWith('H')?'响应':'接收'}}{{!item.type.startsWith('H')?'字段':''}} </label>
                  <loading-outlined
                    v-if="(item.comStatus == 1 || item.type == 'US' && item.listenStatus == 1) && (item.waiting == undefined || item.waiting) && item.recv.length > 0" />
                  <check-circle-outlined v-if="item.waiting == false" />
                </a-space>
                <ParamsList :changeParamIndex="changeParamIndex" :delParam="delParam" :isXs="item.type=='UC'" :type="'recv'"
                  :params="item.recv" :name="item.name" :addParamModalOk="addParamModalOk" :config="item">
                </ParamsList>
              </a-col>
              <a-col :xs="24" :sm="!(item.type == 'US')?24:12" v-if="!(item.type == 'US')">
                <a-space><label><span>{{ item.type == 'US' ? '自动回复' : item.type.startsWith('H')?'请求':'发送' }}</span>字段 </label>
                  <a-button v-if="(item.type.startsWith('T') || item.type == 'UC' || item.type == 'HC') && item.sendType == 'SD'"
                    :disabled="item.type.startsWith('T') && item.comStatus == 0 || !item.type.startsWith('H') && item.send.length == 0"
                    @click="sendClientMsg(item.name, 'send')"  type="primary">发送</a-button>
                </a-space>
                <ParamsList :changeParamIndex="changeParamIndex" :delParam="delParam" :isXs="item.type=='US'" :type="'send'"
                  :params="item.send" :name="item.name" :addParamModalOk="addParamModalOk" :changeValue="changeValue" :config="item">
                </ParamsList>
              </a-col>
            </a-row>
            <!-- 折叠后显示部分 -->
            <a-row v-show="item.hidden == undefined || item.hidden">
              <a-col :xs="24">
                <a-button v-if="(item.type.startsWith('T') || item.type == 'UC' || item.type == 'HC') && item.sendType == 'SD'"
                    :disabled="item.type.startsWith('T') && item.comStatus == 0 || !item.type.startsWith('H') && item.send.length == 0"
                    @click="sendClientMsg(item.name, 'send')"  type="primary">发送</a-button>
                    <div style="margin-left: 10px;">
                      <label>{{ item.miniRes }}</label>
                    </div>
              </a-col>
            </a-row>
          </a-card>
        </a-col>
      </a-row>
      <!-- 新建item模态框 -->
      <a-modal v-model:visible="config.addItemModalShow" title="创建连接" @ok="addItemModalOk" width="800px" ok-text="创建"
        cancel-text="取消">
        <a-form :model="config">
          <a-form-item label="● 连接类型">
            <a-radio-group v-model:value="config.itemType" button-style="solid">
              <a-radio-button value="HC">HTTP客户端</a-radio-button>
              <a-radio-button value="HS">HTTP服务端</a-radio-button>
              <a-radio-button value="TC">TCP客户端</a-radio-button>
              <a-radio-button value="TS">TCP服务器</a-radio-button>
              <a-radio-button value="UC">UDP客户端</a-radio-button>
              <a-radio-button value="US">UDP服务端</a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="● 发送类型">
            <a-radio-group v-model:value="config.sendType" button-style="solid">
              <a-radio-button value="SD">手动</a-radio-button>
              <a-radio-button value="JG">间隔</a-radio-button>
              <a-radio-button v-if="!config.itemType.startsWith('HC')" value="CF">触发</a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item v-if="config.itemType.startsWith('HC')" label="● 方法">
            <a-radio-group v-model:value="config.method" button-style="solid">
              <a-radio-button value="GET">GET</a-radio-button>
              <a-radio-button value="POST">POST</a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="● 间隔时间/ms" v-if="config.sendType == 'JG'">
            <a-input :allowClear="true" v-model:value="config.sendInterval" type="number" style="width:200px"></a-input>
          </a-form-item>
          <a-form-item v-if="config.itemType.startsWith('H')" label="● 接收类型">
            <a-radio-group v-model:value="config.recvType" button-style="solid">
              <a-radio-button value="DC">定长</a-radio-button>
              <a-radio-button value="JSF">结束符</a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item v-if="config.itemType.startsWith('H') && config.method != 'GET'" label="● 发送数据类型">
            <a-radio-group v-model:value="config.sendDataType" button-style="solid">
              <a-radio-button value="json">JSON</a-radio-button>
              <a-radio-button value="text">TEXT</a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item v-if="config.itemType.startsWith('H')" label="● 接收数据类型">
            <a-radio-group v-model:value="config.resDataType" button-style="solid">
              <a-radio-button value="json">JSON</a-radio-button>
              <a-radio-button value="text">TEXT</a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item v-if="config.recvType == 'JSF'" label="● 结束符(16进制数字表示)">
            <a-input :addon-before="'0x'" :allowClear="true" v-model:value="config.recvJsf" type="number"
              style="width:150px"></a-input>
          </a-form-item>
          <a-form-item v-if="config.itemType.endsWith('C') || config.itemType == 'UC'" :label="config.itemType.startsWith('H')?'● 地址':'● 服务器地址:端口'">
            <a-input :allowClear="true" v-model:value="config.comServer" style="width:200px"></a-input>
          </a-form-item>
          <a-form-item v-if="config.itemType.endsWith('S')" label="● 端口">
            <a-input :allowClear="true" v-model:value="config.port" type="number" style="width:120px"></a-input>
          </a-form-item>
          <a-form-item label="● 项目名称">
            <a-input style="width:300px" :allowClear="true" :addon-before="getItemNamePrev()"
              v-model:value="config.newItemName" @keyup.enter="addItemModalOk">
            </a-input>
          </a-form-item>
        </a-form>
      </a-modal>
    </div>
  </a-spin>
</template>

<script>
import ParamsList from "@/components/ParamsList.vue"
import { ExclamationCircleOutlined, LoadingOutlined, CheckCircleOutlined, MoreOutlined } from '@ant-design/icons-vue';
import { createVNode } from 'vue';
import { ipcRenderer } from 'electron'
export default {
  name: 'App',
  data() {
    return {
      spinning1: false,
      spinning2: false,
      itemWs: null,
      config: {
        server: window.location.hostname + ":20003",
        itemType: "HC",
        newItemName: "",
        addParamModalShow: false,
        addItemModalShow: false,
        comServer: "",
        method: "GET",
        sendType: "SD",
        recvType: "DC",
        resDataType: "json",
        sendDataType: "json"
      },
      // status 0未连接 1已连接
      items: [
        /*{
          con: null, type: "TC", name: "测试item", createTime: new Date(), wsStatus: 0, comStatus: 0,
          recv: [{ name: "param1", type: "int32", value: 4, length: 5 }, { name: "param2", type: "str", value: "ceshi", length: 5 }],
          send: [{ name: "param2", type: "str", value: "ceshi", length: 5 }, { name: "param1", type: "int32", value: 4, length: 5 }],
        }*/
      ],
      tmp: {}
    };
  },
  components: {
    ParamsList, LoadingOutlined, CheckCircleOutlined, MoreOutlined
  },
  mounted() {
    
  },
  methods: {
    connectServer(){
      this.init();
    },
    init(){
      this.getAllItems();
      this.initItemWs();
    },
    getItemNamePrev() {
      // return (this.config.itemType == 'TC' ? 'TCP客户端' : this.config.itemType == 'TS' ? 'TCP服务器' : this.config.itemType == 'UC' ? 'UDP客户端' : 'UDP服务端') + '-';
      return this.config.itemType + '-';
    },
    getItemByName(name) {
      let res = null;
      this.items.forEach(item => {
        if (item.name == name) {
          res = item;
        }
      });
      return res;
    },
    initItemWs() {
      this.spinning2 = true;
      this.itemWs = new WebSocket(`ws://${this.config.server}/item`);
      this.itemWs.onopen = () => {
        this.spinning2 = false;
      };
      this.itemWs.onmessage = (e) => {
        let res = JSON.parse(e.data);
        let action = res.action;
        if (action == "update") {
          this.items.splice(0, 0, res.item);
          this.initComWs(res.item.name);
        } else if (action == "updateParams") {
          let item = this.getItemByName(res.name);
          item[res.type] = res.params;
        }
      }
    },
    initComWs(name) {
      let item = this.getItemByName(name);
      item.client = new WebSocket(`ws://${this.config.server}/connect?name=${item.name}`);
      // item.client.onopen = (e) => {
      //   item.client.send("connect");
      // }
      item.client.onmessage = (e) => {
        console.log("onmessage", e);
        let res = JSON.parse(e.data);
        let action = res.action;
        if (action == "update") {
          let updData = res.updData;
          let { key, value } = updData;
          let keys = key.split(".");
          let tmp = "item";
          for (let i = 0; i < keys.length; i++) {
            tmp += `['${keys[i]}']`;
          }
          tmp += "=" + value;
          eval(tmp);
        } else if (action == "data") {
          let data = res.data;
          if(item.type.startsWith('H') && item.config.resDataType == 'text'){
            item.recv[0].value = data;
          }else if(data){
            for (let i = 0; i < data.length; i++) {
              item.recv[i].value = data[i];
            }
          }
          item.waiting = false;
          setTimeout(() => {
            item.waiting = true;
          }, 100);
          // 显示折叠后的数据
          // if(item.hidden){
            let tmp = {};
            item.recv.forEach(item=> tmp[item.name] = item.value);
            item.miniRes = JSON.stringify(tmp);
          // }
        } else if(action == "error"){
          this.$message.error(res.data);
        }
      }
      item.client.onclose = (e) => {
        console.log("onclose", e);
      }
    },
    initAllComWs() {
      this.items.forEach(item => {
        this.initComWs(item.name);
      });
    },
    sendItemMsg(type, name, data) {
      let msg = { type: type };
      msg[name] = data;
      this.itemWs.send(JSON.stringify(msg));
    },
    getAllItems() {
      this.spinning1 = true;
      let ws = new WebSocket(`ws://${this.config.server}/getAll`);
      ws.onopen = () => {
        ws.send(1);
      }
      ws.onerror = () => {
        this.spinning1 = false;
        this.$message.error("读取服务器配置失败");
      }
      ws.onmessage = (e) => {
        let items = JSON.parse(e.data);
        this.items = items.reverse();
        this.initAllComWs();
        this.spinning1 = false;
        ws.close();
      }
    },
    createItem(cb) {
      if (this.config.sendType == "JG" && (!this.config.sendInterval || this.config.sendInterval <= 0)) {
        this.$message.info(`输入正确间隔时间`);
        return false;
      }
      if (this.config.itemType.endsWith("C") && !this.config.comServer) {
        this.$message.info(`输入服务端地址`);
        return false;
      }
      if (!this.config.newItemName) {
        this.$message.info(`输入项目名称`);
        return false;
      }
      let hasItem = false;
      let name = this.getItemNamePrev() + this.config.newItemName;
      let type = this.config.itemType;
      let sendType = this.config.sendType;
      let comServer = this.config.comServer;
      let sendInterval = this.config.sendInterval;
      let port = this.config.port;
      this.items.forEach(item => {
        if (item.name == name) {
          hasItem = true;
        }
      });
      if (hasItem) {
        this.$message.error(`名称“${name}”重复`);
        return false;
      } else {
        let item = { type, name, createTime: new Date().getTime(), recv: [], send: [], comStatus: 0, wsStatus: 0, sendType, comServer, sendInterval, port, config: this.config };
        this.config.newItemName = "";
        this.sendItemMsg("add", "item", item);
        cb();
      }
    }, sendClientMsg(name, msg) {
      let item = this.getItemByName(name);
      item.recv.forEach(item=>item.value='');
      item.miniRes = '';
      item.client.send(msg);
    }, delItem(name) {
      let self = this;
      this.$confirm({
        title: '确定删除此项目?',
        icon: createVNode(ExclamationCircleOutlined),
        okText: "确定",
        cancelText: "取消",
        content: createVNode('div', { style: 'color:red;' }, '此操作无法恢复'),
        onOk() {
          for (let i = 0; i < self.items.length; i++) {
            if (self.items[i].name == name) {
              self.sendItemMsg("del", "name", name);
              self.items.splice(i, 1);
            }
          }
        },
        onCancel() {
          console.log('Cancel');
        },
      });
    }, addParamModalOk(name, param, type) {
      this.sendItemMsg("addParam", "data", { name, param, type });
    }, addItemModalOk() {
      this.createItem(() => {
        this.config.addItemModalShow = false;
      });
    }, changeValue(name, type, paramName, value) {
      this.sendItemMsg("editParam", "data", { name, type, paramName, value });
    }, delParam(name, type, paramName) {
      let self = this;
      this.$confirm({
        title: '确定删除此字段?',
        icon: createVNode(ExclamationCircleOutlined),
        okText: "确定",
        cancelText: "取消",
        content: createVNode('div', { style: 'color:red;' }, '此操作无法恢复'),
        onOk() {
          self.sendItemMsg("delParam", "data", { name, type, paramName });
        },
        onCancel() {
          console.log('Cancel');
        },
      });
    }, changeParamIndex(name, type, paramName, value) {
      this.sendItemMsg("changeParamIndex", "data", { name, type, paramName, value });
    }
  }
}
</script>

<style>
#parent-div {
  padding: 10px;
}
.action-btn{
  margin: 2px 5px;
}
</style>
