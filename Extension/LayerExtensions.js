// Name: 图层管理 / Layer Management
// ID: LayerManagement
// Description: 业界首个用于 TurboWarp 的图层管理扩展 / The industry's first layer management extension for TurboWarp
// By: 无心小白僵尸 / Wxxbjs
// License: 比 MIT 更宽松的协议 / A more permissive license than MIT
// Scratch-compatible: false
// Extended version: v0.6.8

/* 更新 Tips:
 * - 更加规范的扩展格式和开发，补充大量注释
 * - 再也不乱敢用this了。吃了个好大的教训。TAT
 * - 优化，封装，规范，全新的版本
 * - 小bug修复。
 * - 逆天targets引用不是Scratch.vm.runtime.targets。尝试与其斗争。失败。逐放弃。全都得改。
 * - 增加一个新积木
*/

(function(Scratch){
    "use strict";
    
    const Cast=Scratch.Cast;
    const vm=Scratch.vm;
    const runtime=vm.runtime;
    const renderer=vm.renderer;

    const ExtensionsName="LayerManagement";
    const _myself_="_myself_";
    const _all_="_all_";
    function toString(value){return Cast.toString(value)};
    function toNumber(value){return Cast.toNumber(value)};
    function compare(value1,value2){return Cast.compare(value1,value2)};

    const LayerHierarchy=Symbol("LayerHierarchy");//图层层级
    const SortValue=Symbol("SortValue");//排序值
    const def1=undefined;
    const def2=undefined;

    const createAttributeForTarget=(target,originalTarget)=>{
        if(LayerHierarchy in target&&SortValue in target)return;
        target[LayerHierarchy]=originalTarget?originalTarget[LayerHierarchy]:def2;
        target[SortValue]=originalTarget?originalTarget[SortValue]:def1;
    };
    const updateTargets=()=>runtime.targets.forEach(target=>createAttributeForTarget(target));
    runtime.on("targetWasCreated",(target,originalTarget)=>createAttributeForTarget(target,originalTarget));
    runtime.on("PROJECT_LOADED",updateTargets);
    updateTargets();

    //状态类
    class Status{
        constructor(current=false,lastTime=false){this.current=current,this.lastTime=lastTime;}
        set(value){this.lastTime=this.current,this.current=value;}
        getCurrent(){return this.current;}
        getLastTime(){return this.lastTime;}
        isUpward(){return !this.lastTime&&this.current;}
        isDownward(){return this.lastTime&&!this.current;}
        isUnchanged(){return this.current===this.lastTime;}
    }

    //启动图层管理
    const isLayerManagement=new Status();
    //层级列表
    var hierarchys=[];
    //层级权重表
    var hierarchysWeight={};
    //默认层级
    var defaultHierarchy=undefined;

    //辅助函数（通常不提供调用）
    //设置角色数据
    function setSpriteData(target,key,value){
        const pd=target[key]!==value;
        target[key]=value;
        return pd;
    }
    //获取角色数据
    function getSpriteData(target,key){
        if(key==="图层序号")return runtime.executableTargets.findIndex(it=>it.drawableID===target.drawableID);
        if(!(key in target))return"";//没有该属性，返回空字符串
        const value=target[key];//获取值
        if(value!==undefined)return value;//有有效值
        else if(key===LayerHierarchy)return defaultHierarchy;//要获取层级，但是未指定具体的值
        else if(key===SortValue)return Infinity;//要获取排序值，但是未设置具体的值
        else return"";//其他未知的访问
    }
    //取角色的层级权重
    function spriteHierarchy(target){
        const hierarchy=hierarchysWeight[getSpriteData(target,LayerHierarchy)];//取层级权重
        return hierarchy!==undefined?hierarchy:hierarchys.length;//处理未知的情况
    };
    //排序规则
    function sortCompare(Asprite,Bsprite){
        if(Asprite.isStage&&Bsprite.isStage)return 0;      //A是舞台，B是舞台，不要动
        else if(Asprite.isStage&&!Bsprite.isStage)return-1;//A是舞台，B是角色，A要在B前面
        else if(!Asprite.isStage&&Bsprite.isStage)return 1;//A是角色，B是舞台，B要在A前面
        //A、B都是角色，正常排序
        const Ahierarchy=spriteHierarchy(Asprite);//取角色的层级权重
        const Bhierarchy=spriteHierarchy(Bsprite);//同理
        //规则
        if(Ahierarchy!==Bhierarchy)return Ahierarchy>Bhierarchy?-1:1;
        else return-compare(getSpriteData(Asprite,SortValue),getSpriteData(Bsprite,SortValue));
    }
    //主动全排序
    function sortSpriteLayer(){
        const executableTargets=runtime.executableTargets;//获取运行时对象
        executableTargets.sort((a,b)=>sortCompare(a,b));//主排序
        const TargetDrawableIDList=executableTargets.map(it=>it.drawableID);//取图层ID
        const TargetDrawableIDset=new Set(TargetDrawableIDList);//通过set快速获取元素是否存在
        const drawList=renderer._drawList;//渲染列表
        for(let i=0,j=0;i<drawList.length;++i)if(TargetDrawableIDset.has(drawList[i]))drawList[i]=TargetDrawableIDList[j++];//仅替换角色的图层ID，其他的不动
        renderer.dirty=true;//刷新
    }
    //对单个角色进行排序（前提是有序的）
    function tempSpriteLayerSort(target){
        if(!isLayerManagement.getCurrent())return;//未开启图层管理，不保证有序的，直接返回
        const executableTargets=runtime.executableTargets;//所有角色的图层target
        const drawableID=target.drawableID;//当前角色图层ID
        const idx=executableTargets.findIndex(it=>it.drawableID===drawableID);//原始idx
        const pd=(Aidx,Bidx)=>sortCompare(executableTargets[Aidx],executableTargets[Bidx]);//方法
        //根据单调性，左右维护的值只能有一个出现true，除非用户在未知的地方调过图层，不可能有既要左维护又要右维护
        const isLeft=0<idx&&!(pd(idx-1,idx)<=0);//是否左维护
        const isRight=idx<executableTargets.length-1&&!(pd(idx,idx+1)<=0);//是否右维护
        const isMove=isLeft||isRight;//是否移动过
        //二分优化
        let L,R,mid;
        if(isLeft){
            L=0,R=idx-1;// [0,IDidx-1] 区间
            //需要找到 等后，即位于 大 区间 最前的元素，不位于 小、等 区间
            while(L<R){
                mid=L+((R-L)>>1);//明显，向下取整
                if(pd(idx,mid)<0)R=mid;//说明mid处于大区间，右端点向左缩
                else L=mid+1;//说明mid处于小、等区间，左端点向右缩，且这个位置绝对不是目标位置
            }
        }
        else if(isRight){
            L=idx+1,R=executableTargets.length-1;// [IDidx+1,executableTargets.length-1] 区间
            //需要找到 等前，即位于 小 区间 最后的元素，不位于 等、大 区间
            while(L<R){
                mid=L+((R-L-1)>>1)+1;//明显，向上取整
                if(pd(mid,idx)<0)L=mid;//说明mid处于小区间，左端点向右缩
                else R=mid-1;//说明mid处于等、大区间，右端点向左缩，且这个位置绝对不是目标位置
            }
        }
        const ans=L;//最终位置
        if(isMove){
            target.goForwardLayers(ans-idx);//更加快速便捷的函数
            renderer.dirty=true;//刷新
        }
    }
    //用名字访问或者指向自己
    function getTarget(name,util){
        return name===_myself_?util.target:runtime.getSpriteTargetByName(name);
    }
    //获取角色文件路径数组，是真实存在的路径，且可以是多级文件路径，尽管tw原生都不支持多级文件渲染，这里我们自己实现
    //元素格式是： 文件名1//文件名2//文件名3//...
    //至少是：文件名//
    function getFolderPathList(){
        const paths=new Set();//存储文件路径，自动去重
        runtime.targets.forEach(target=>{//遍历
            if(target.isSprite()){//取角色
                const name=target.sprite.name;//原数据
                const idx=name.lastIndexOf("//");//分割点
                const path=idx>=0?name.substr(0,idx+2):"";//纯路径
                if(path!=="")paths.add(path);//必须有路径才取结果
            }
        });
        return Array.from(paths);
    }
    //获取指定文件路径下所有角色，这里定义空字符串路径表示全匹配
    function getTargetsInFolderPath(path=""){
        if(typeof path!=="string")return[];
        return runtime.targets.reduce((acc,target)=>{
            if(target.isSprite()&&target.sprite.name.startsWith(path))acc.push(target);
            return acc;
        },[]);
    }

    class LayerManagement{
        constructor(){

        }
        getInfo(){
            return{
                id:ExtensionsName,
                name:"图层管理",
                color1:"#7a52cc",
                color2:"#6a4aab",
                color3:"#5f3ea2",
                blocks:[
                    {
                        blockType:Scratch.BlockType.LABEL,
                        text:"全局构造"
                    },
                    {
                        opcode:"launchLayerManagement",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"[OFForON] 图层管理",
                        arguments:{
                            OFForON:{
                                type:Scratch.ArgumentType.STRING,
                                menu:"OFForON"
                            }
                        }
                    },
                    {
                        opcode:"constructHierarchicalRelationships",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"构造 [hierarchys] 层级关系，并将 [hierarchy] 设为默认层",
                        arguments:{
                            hierarchys:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:"UI层,默认层,背景层"
                            },
                            hierarchy:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:"默认层"
                            }
                        }
                    },
                    {
                        opcode:"batchLayerTransfer",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"将文件夹 [path] 中的 [type] 移至 [hierarchy]",
                        arguments:{
                            path:{
                                type:Scratch.ArgumentType.STRING,
                                menu:"folderPathSelector"
                            },
                            type:{
                                type:Scratch.ArgumentType.STRING,
                                menu:"targetTypeSelector"
                            },
                            hierarchy:{
                                type:Scratch.ArgumentType.STRING,
                                menu:"hierarchysList"
                            }
                        }
                    },
                    {
                        blockType:Scratch.BlockType.LABEL,
                        text:"私有处理"
                    },
                    {
                        opcode:"setSpriteHierarchy",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"将 [name] 移至 [hierarchy]",
                        arguments:{
                            name:{
                                type:Scratch.ArgumentType.STRING,
                                menu:"spriteNameAndMyself"
                            },
                            hierarchy:{
                                type:Scratch.ArgumentType.STRING,
                                menu:"hierarchysList"
                            }
                        }
                    },
                    {
                        opcode:"setSpriteSortValue",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"将 [name] 的排序值设为 [value]",
                        arguments:{
                            name:{
                                type:Scratch.ArgumentType.STRING,
                                menu:"spriteNameAndMyself"
                            },
                            value:{
                                type:Scratch.ArgumentType.NUMBER,
                                defaultValue:0
                            }
                        }
                    },
                    {
                        opcode:"returngetSpriteData",
                        blockType:Scratch.BlockType.REPORTER,
                        text:"[name] 的 [key]",
                        arguments:{
                            name:{
                                type:Scratch.ArgumentType.STRING,
                                menu:"spriteNameAndMyself"
                            },
                            key:{
                                type:Scratch.ArgumentType.STRING,
                                menu:"spriteDatasList"
                            }
                        }
                    },
                    {
                        blockType:Scratch.BlockType.LABEL,
                        text:"仅测试 [⚠] （通常来说你不应该使用）"
                    },
                    {
                        opcode:"sortSpriteLayer",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"对所有角色进行图层排序",
                        arguments:{}
                    },
                    {
                        opcode:"debug",
                        blockType:Scratch.BlockType.REPORTER,
                        text:"debug",
                        arguments:{}
                    }
                ],
                menus:{
                    OFForON:[
                        {text:"开启",value:"true"},
                        {text:"关闭",value:"false"}
                    ],
                    hierarchysList:{
                        acceptReporters:true,
                        items:"returnHierarchysList"
                    },
                    spriteDatasList:["层级","排序值","图层序号"],
                    spriteNameAndMyself:{
                        acceptReporters:true,
                        items:"returnSpriteNameAndMyself"
                    },
                    folderPathSelector:{
                        acceptReporters:true,
                        items:"returnFolderPathSelector"
                    },
                    targetTypeSelector:["角色和克隆体","角色","克隆体"]
                }
            };
        }
        //主逻辑
        //开启排序
        launchLayerManagement(args,util){
            const OFForON=toString(args.OFForON)==="true";

            isLayerManagement.set(OFForON);//设置状态
            if(isLayerManagement.isUpward())sortSpriteLayer();//仅由不开到开启时才进行一次排序
        }
        //构造层级
        constructHierarchicalRelationships(args,util){
            const argHierarchy=toString(args.hierarchy);
            const argHierarchys=toString(args.hierarchys);

            hierarchys=argHierarchys.split(',');//构造列表
            hierarchysWeight=hierarchys.reduce((acc,it,idx)=>{
                acc[it]=idx;
                return acc;
            },{});//构造权重
            defaultHierarchy=hierarchys.includes(argHierarchy)?argHierarchy:undefined;//构造默认层级
            if(isLayerManagement.getCurrent())sortSpriteLayer();//若开启，则直接排序
        }
        //批量转移图层
        batchLayerTransfer(args,util){
            const path=toString(args.path);
            const type=toString(args.type);
            const hierarchy=toString(args.hierarchy);

            if(getTargetsInFolderPath(path===_all_?"":path).reduce((acc,target)=>{
                if(type==="角色和克隆体")acc.push(target);
                else if(type==="角色"&&!target.isOriginal)acc.push(target);
                else if(type==="克隆体"&&target.isOriginal)acc.push(target);
                return acc;
            },[]).reduce((pd,target)=>setSpriteData(target,LayerHierarchy,hierarchy)||pd,false))sortSpriteLayer();
        }
        //设置层级
        setSpriteHierarchy(args,util){
            const name=toString(args.name);
            const hierarchy=toString(args.hierarchy);

            const target=getTarget(name,util);

            //如果是舞台，不执行任何操作
            if(target.isStage)return;

            if(setSpriteData(target,LayerHierarchy,hierarchy))tempSpriteLayerSort(target);
        }
        //设置排序值
        setSpriteSortValue(args,util){
            const name=toString(args.name);
            const value=toNumber(args.value);

            const target=getTarget(name,util);

            //如果是舞台，不执行任何操作
            if(target.isStage)return;

            if(setSpriteData(target,SortValue,value))tempSpriteLayerSort(target);
        }
        //返回属性
        returngetSpriteData(args,util){
            const name=toString(args.name);
            const key=toString(args.key);
            
            const target=getTarget(name,util);

            //如果是舞台，返回空字符串
            if(target.isStage)return"";
            
            const practicalKey=key==="层级"?LayerHierarchy:data==="排序值"?SortValue:key;
            const value=getSpriteData(target,practicalKey);
            return value?value:"";
        }
        sortSpriteLayer(args,util){
            sortSpriteLayer();
        }
        //菜单构造
        //层级菜单
        returnHierarchysList(){
            return hierarchys.length?hierarchys:["-"];
        }
        //角色选择器
        returnSpriteNameAndMyself(){
            return runtime.targets.reduce((acc,it)=>{
                if(it.isSprite()&&it!==runtime._editingTarget)acc.push(it.sprite.name);
                return acc;
            },[{text:"我",value:_myself_}]);
        }
        //目标文件选择器
        returnFolderPathSelector(){
            return getFolderPathList().reduce((acc,it)=>{
                acc.push({text:it,value:it});
                return acc;
            },[{text:"所有角色",value:_all_}]);
        }
        //debug
        debug(args,util){
            return JSON.stringify(hierarchys)+"\n"+
                   JSON.stringify(defaultHierarchy)+"\n"+
            "";
        }
    }
    Scratch.extensions.register(new LayerManagement());
})(Scratch);