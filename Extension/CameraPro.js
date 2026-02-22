// Name: 多相机 / Camera Pro
// ID: CameraPro
// Description: 多相机渲染，更多的相机参数，还有更快的性能 / Multi-camera rendering
// By: 无心小白僵尸 / Wxxbjs
// License: 比 MIT 更宽松的协议 / A more permissive license than MIT
// Scratch-compatible: false
// Extended version: v0.5.9

/* 更新 Tips:
 * - 基本实现了渲染需求，接下来就是处理细节和优化逻辑
 * - Tree类和相关结构重新设计，接口直观、便捷
 * - 修复许多bug（对话框渲染错误，被删除的角色错误渲染）
 * - 增加三个积木
 * - 逆天targets引用不是Scratch.vm.runtime.targets。尝试与其斗争。失败。逐放弃。全都得改。
 * - 把关于舞台的处理给做了，现在舞台无法调用有关角色的积木
 
 * - 此后，每次更新都附带对应版本号和更新内容
     但是由于以上更新的版本号没有记录，所以并没有尊虚这一格式。

 * - v0.2.7：
     增加获取角色渲染后的x、y、方向、大小属性
 * - v0.4.8：
     更新一个优化
     核心原理就是：相机节点一路上的所有变换都可以用一次变换描述（此后简称为“概括变换”、“跳跃变换”）
     但是此版本一个比较明显的问题就是：由于是以相机为计算标准，如果大量修改相机属性，容易导致计算多次子树，浪费了大量复杂度
     但是这无法解决：
     1.我要求数据必须真实：相机的属性此时是什么，角色的属性此时是什么，全局状态此时就是什么，不能延迟或者滞后计算
       这导致所有关于 标记 的优化思路从一开始就是无效的（因为标记后一定是更新的，不就等于甚至复杂于没有标记么。）
       所以一旦修改相机节点必然会进行一次渲染，也就是强制子树计算概括变换，那么就是O(n)
     2.属性本身就是分散修改的，如果只是更新一次相机属性必然会导致O(kn)的复杂度甚至更多（k很小，4<=k<=8，但是不能忽略）
     3.概括变换的维护本身就需要k个参照点同时带入原变换函数再计算，也就是在原本的f(n)的复杂度变为O(k·f(n))的复杂度（k很小，3<=k<=5，但是不能忽略）
     4.只有在角色多、渲染多、修改少、节点深度深，才能发挥概括变换的优势
     虽然看着也挺美好
     但是如果用户只是利用单相机的变换，甚至通常只使用一个相机
     那么以上的所有的额外计算统统会成为负担，浪费大量复杂度
     所以我打算将“优化”设计成用户可以选择的接口
     目前完成了概括变换实现
     但是我并没有展开高强度测试，只保证功能基本可用，可能会有bug。
     不过渲染目前是正确的。

     更新了一个新积木，现在可以获取角色渲染到舞台的信息了
     修复了一个bug（当target不存在（为undefined）时，尝试获取属性导致报错）
 * - v0.5.9：
     修复关于渲染的一些bug（当target不存在不传递相机变换后数据，会影响某些不带target的计算需求）
     增加两个新的相机参数：RFCd & RFCs

     另外考虑到部分用户可能对相机参数不理解，这里简单描述一下：
     - 相机参数名中含有 x,y,d,x 的分别表示 x坐标 y坐标 方向 大小
     - 相机参数 x,y,d,s 可以想象成相机内维的变换
       或者想象成相机窗口观察当前相机世界的世界位置，只改变游览的位置
       也就是传统的标准相机模型的参数；
     - 而相机参数 RFC 系列（R 架到 F 父 C 相机 ，字面意思。），即 RFCx,RFCy,RFCd,RFCs 可以想象相机外维的变换
       或者把相机也想象成为一个“角色”，而这个“角色”也有自己处在的世界的 x,y,d,s ，也可以带入到父相机的变换里
     这样相机也可以抽象成“角色”带入到父相机的变换了，很大程度上减少了认知负担

*/

(function(Scratch){
    "use strict";

    const Cast=Scratch.Cast;
    const vm=Scratch.vm;
    const runtime=vm.runtime;
    const renderer=vm.renderer;

    const ExtensionsName="CameraPro";
    const _myself_="_myself_";
    const radianConstant=Math.PI/180;
    function sin(x){return Math.sin(x*radianConstant)};
    function cos(x){return Math.cos(x*radianConstant)};
    function toString(value){return Cast.toString(value)};
    function toNumber(value){return Cast.toNumber(value)};
    function compare(value1,value2){return Cast.compare(value1,value2)};

    const AssociatedCamera=Symbol("AssociatedCamera");//角色所属相机
    const rendererX=Symbol("rendererX");//角色的渲染x
    const rendererY=Symbol("rendererY");//角色的渲染y
    const rendererD=Symbol("rendererD");//角色的渲染方向
    const rendererS=Symbol("rendererS");//角色的渲染大小
    const def1="";

    const createAttributeForTarget=(target,originalTarget)=>{
        if( AssociatedCamera in target &&
            rendererX in target &&
            rendererY in target &&
            rendererD in target &&
            rendererS in target &&
        true)return;
        target[AssociatedCamera]=originalTarget?originalTarget[AssociatedCamera]:def1;
        target[rendererX]=originalTarget?originalTarget[rendererX]:target.x;
        target[rendererY]=originalTarget?originalTarget[rendererY]:target.y;
        target[rendererD]=originalTarget?originalTarget[rendererD]:target.direction;
        target[rendererS]=originalTarget?originalTarget[rendererS]:target.size;
    };
    const updateTargets=()=>runtime.targets.forEach(target=>createAttributeForTarget(target));
    runtime.on("targetWasCreated",(target,originalTarget)=>createAttributeForTarget(target,originalTarget));
    runtime.on("PROJECT_LOADED",updateTargets);
    updateTargets();

    function setSpriteData(target,key,value){
        if(typeof target!=="object"||target.isStage)return false;
        const pd=target[key]!==value;
        target[key]=value;
        return pd;
    }
    function getSpriteData(target,key){
        if(typeof target==="object"&&key in target)return target[key];
        return undefined;
    }

    //禁用舞台限制
    runtime.runtimeOptions.fencing=false;
    //开启离屏触摸
    renderer.offscreenTouching=true;

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

    const isOptimization=new Status();

    class Dot{
        constructor(x=0,y=0,d=90,s=100){
            this.x=x,this.y=y,this.d=d,this.s=s;
        }
    }

    function coordinateTransformation(dot,origin){
        const newDot=new Dot();
        const invSin=sin(origin.d);
        const invCos=cos(origin.d);
        const invSize=origin.s/100;
        newDot.x=(dot.x*invSin-dot.y*invCos)*invSize+origin.x;
        newDot.y=(dot.x*invCos+dot.y*invSin)*invSize+origin.y;
        newDot.d=dot.d+(origin.d-90);
        newDot.s=dot.s*invSize;
        return newDot;
    }

    class TreeNode{
        constructor(parentNode=null,childNode=new Set(),data=undefined,bindSet=new Set()){
            this.parentNode=parentNode;
            this.childNode=childNode;
            this.data=data;
            this.bindSet=bindSet;//绑定集合
        }
    }

    class Tree{
        constructor(tree={}){
            //树对象
            this.tree={...tree};
            this.virtual=Symbol("virtual");//虚节点
            this.tree[this.virtual]=new TreeNode();
            //自创父节点，定义：
            //parentNode 属性：不存在
            //characterNode 属性：存储虚连接的节点，这些节点的原父节点都不存在，都是暂时与virtual连接
            //data 属性：待定
            //bindSet 属性：不使用
            this.virtualBindMap=new Map();//虚绑定映射
            //用作映射虚连接节点的绑定关系数据
            //注意：virtualBindMap 此时的意义是存储虚连接的节点数据，而不是虚节点自己被绑定的数据，因为虚节点不需要被绑定
            //virtualBindMap 的 Map 格式是： A => bindSet ，其中A是未创建但是已经有绑定关系的节点， bindSet 是A节点的绑定信息
        }
        
        //搞清楚一点，A,B参数都是字符串
        //有一个新概念，当A指向B时，保证A绝对存在，B可能不存在
        //若B不存，则建立虚连接，明面上A指向B，实际上暂时连接virtual，保证可通过遍历virtual遍历树，不创建B
        //若B存在，正常建立

        //节点参数合法判断
        nodeValid(A){
            return typeof A==="string";
        }
        //判断A是否存在，这里定义virtual不存在
        has(A){
            return this.nodeValid(A)&&A in this.tree;
        }
        //获取指向A的虚连接节点
        getVirtualChildrenNode(A){
            const virtualChildren=[];
            for(const it of this.tree[this.virtual].childNode)if(this.tree[it].parentNode===A)virtualChildren.push(it);
            return virtualChildren;
        }
        //获取A的真父节点（不是虚连接）
        getParentNode(A){
            //A不存在，返回null
            if(!this.has(A))return null;
            //A的父节点存在，返回父节点
            if(this.has(this.tree[A].parentNode))return this.tree[A].parentNode;
            //父节点不存在，则是虚连接，返回虚节点
            return this.virtual;
        }
        //判断A能不能加入到B旗下
        addNodeValid(A,B){
            //参数都不合法，不可以
            if(!this.nodeValid(A)||!this.nodeValid(B))return false;
            //如果将A与B连接造成循环引用，则不能添加
            for(let current=B;this.nodeValid(current);current=current in this.tree?this.tree[current].parentNode:this.virtual)if(current===A)return false;
            //不存在循环引用，可以添加
            return true;
        }
        //A加入到B旗下，data用作传参，Tree类只允许使用这种方法添加新节点，且不允许父节点直接为virtual
        addNode(A,B,data=undefined){
            //参数合法，以及不允许循环引用，如果不是就不执行任何操作
            if(!this.addNodeValid(A,B))return;
            //保证A存在，如果A不存在，就新加入节点A
            if(!this.has(A)){
                //创建新节点
                this.tree[A]=new TreeNode(this.virtual,new Set(),data,new Set());
                //获取虚连接节点
                const virtualChildren=this.getVirtualChildrenNode(A);
                //遍历虚连接节点
                for(const it of virtualChildren){
                    //断开连接
                    this.tree[this.virtual].childNode.delete(it);
                    //建立连接
                    this.tree[A].childNode.add(it);
                }
                //虚节点存在A的绑定数据，转移
                if(this.virtualBindMap.has(A)){
                    //将虚连接时的绑定数据转移到A上
                    this.tree[A].bindSet=this.virtualBindMap.get(A);
                    //删除这个映射
                    this.virtualBindMap.delete(A);
                }
            }
            //删除A与父节点的连接
            this.tree[this.getParentNode(A)].childNode.delete(A);
            //建立A的父连接
            this.tree[A].parentNode=B;
            //若B存在
            if(this.has(B)){
                //建立B的子连接
                this.tree[B].childNode.add(A);
            }
            //若B不存在
            else{
                //先建立与virtual的连接
                this.tree[this.virtual].childNode.add(A);
            }
        }
        //删除A节点，同时返回是否删除成功
        //根据定义，如果A被删除，则子节点绑定到virtual下形成与A的虚连接
        deleteNode(A){
            //A不存在
            if(!this.has(A))return false;
            //断开和父节点的连接
            this.tree[this.getParentNode(A)].childNode.delete(A);
            //子节点建立与virtual的连接
            for(const it of this.tree[A].childNode)this.tree[this.virtual].childNode.add(it);
            //建立虚连接绑定数据映射
            this.virtualBindMap.set(A,this.tree[A].bindSet);
            //删除
            delete this.tree[A];
            //成功
            return true;
        }
        //全部删除
        clear(){
            //因为所有节点都被删除，节点关系将完全丢失，完全可以把所有节点直接删除，而不是一个个调用deleteNode
            //获取所有节点，因为virtual是Symbol类型，所以不会被计入
            const nodes=Object.keys(this.tree);
            for(const it of nodes){
                //将节点的绑定数据转移到虚连接的映射上
                this.virtualBindMap.set(it,this.tree[it].bindSet);
                //删除节点
                delete this.tree[it];
            }
            //只需要把虚连接的子节点删掉就行了
            this.tree[this.virtual].childNode.clear();
        }
        //绑定数据至节点，建立节点与外部数据的关系
        bindData(A,bindData){
            //A不合法，不进行任何操作
            if(!this.nodeValid(A))return;
            //正常绑定
            if(this.has(A))this.tree[A].bindSet.add(bindData);
            //可能是虚连接
            else if(this.virtualBindMap.has(A))this.virtualBindMap.get(A).add(bindData);
            //连虚连接都没有，手动创建一个虚连接
            else this.virtualBindMap.set(A,new Set().add(bindData));
        }
        //解除绑定数据至节点，删除节点与外部数据的关系
        unBindData(A,bindData){
            //A不合法，不进行任何操作
            if(!this.nodeValid(A))return;
            //正常删除
            if(this.has(A))this.tree[A].bindSet.delete(bindData);
            //可能是虚连接
            else if(this.virtualBindMap.has(A))this.virtualBindMap.get(A).delete(bindData);
            //连虚连接都没有，不用管，因为本来就是要删除
        }
        //设置A节点的数据
        setData(A,data){
            if(this.has(A))this.tree[A].data=data;
        }
        //获取A节点的信息
        getData(A){
            if(this.has(A))return this.tree[A].data;
            return undefined;
        }
        //获取绑定信息
        getBindData(A){
            //A不合法，返回空集合
            //（原本应该返回undiluted，但是考虑到返回值统一就算了，而且不应该是提前保证参数合法再获取吗。）
            //（想明白了。就是需要统一返回Set，然后bind和unBind就可以直接简单对目标Set操作了，而不是重写一样的逻辑。）
            //（哦不对，bind还需要在连虚连接都没有的情况下手动创建新的映射，不好简单操作。）
            //（嗯……或许绑定的时候稍稍建立一下这种情况的映射？但是这会破坏对纯返回的定义……不知道怎么处理。）
            //（反正都是写，还不如分开写清楚一点。压了也没意义。不管了。）
            if(!this.nodeValid(A))return new Set();
            //正常获取
            if(this.has(A))return this.tree[A].bindSet;
            //可能是虚连接
            else if(this.virtualBindMap.has(A))return this.virtualBindMap.get(A);
            //连虚连接都没有，直接返回空集合
            return new Set();
        }
        //输出为对象，结构清晰
        out(A=this.virtual){
            //A不是根节点且不存在
            if(A!==this.virtual&&!this.has(A))return{};
            const obj={};
            for(const it of this.tree[A].childNode)obj[it]=this.out(it);
            return obj;
        }
    }

    //相机树
    class CamerasTree extends Tree{
        constructor(tree={}){
            super(tree);
            //将被删除的角色的targt移除绑定数据，避免渲染不存在的对象导致报错
            runtime.on("targetWasRemoved",target=>{
                this.unBindData(target[AssociatedCamera],target);
            });
            //篡改自己的方法，默认且强制传入数据
            const ogAddNOde=this.addNode;
            this.addNode=function(A,B){ogAddNOde.call(this,A,B,new Camera());}
        }
        //通过一个节点，将当前和旗下所包含的所有角色的target加入到一个列表中
        //别问为什么写这个函数，因为实在懒得优化了。
        getTargets(A=this.virtual){
            if(A!==this.virtual&&!this.has(A))return this.getTargets();
            const targets=A===this.virtual?Array.from(this.virtualBindMap.values()).reduce((acc,it)=>{
                Array.prototype.push.apply(acc,Array.from(it));
                return acc;
            },[]):Array.from(this.tree[A].bindSet);
            for(const it of this.tree[A].childNode)Array.prototype.push.apply(targets,this.getTargets(it));
            return targets;
        }
        //扩展计算子相机的跳跃分量，dfs递归遍历（父节点扩展计算，从当前节点位置的已知数据扩展到子节点）
        dfs_parentNode_computeDirectTransformation(A=this.virtual){

            // console.log(A,"正在进行父扩展计算");
            // console.log("节点：",this.tree[A].childNode);
            // console.log("树：",this.tree);

            if(A!==this.virtual&&!this.has(A))return;
            //父节点数据，虚节点特殊处理，用默认相机数据计算，即舞台数据
            const parentNodeData=A===this.virtual?new Camera():this.tree[A].data;
            //遍历子节点
            for(const it of this.tree[A].childNode){
                //子节点数据
                const childNodeData=this.tree[it].data;
                //带入
                const obj=computeDirectTransformation(childNodeData,parentNodeData);
                //返回并设置
                childNodeData.optimization_ox=obj.optimization_ox;
                childNodeData.optimization_oy=obj.optimization_oy;
                childNodeData.optimization_xx=obj.optimization_xx;
                childNodeData.optimization_xy=obj.optimization_xy;
                childNodeData.optimization_yx=obj.optimization_yx;
                childNodeData.optimization_yy=obj.optimization_yy;
                childNodeData.optimization_od=obj.optimization_od;
                childNodeData.optimization_os=obj.optimization_os;
                //递归
                this.dfs_parentNode_computeDirectTransformation(it);
            }
        }
        //从当前节点开始，用父节点的数据计算，dfs递归遍历（子节点前缀计算，根据父节点的已知信息计算当前节点，并遍历子节点）
        dfs_childNode_computeDirectTransformation(A=this.virtual){

            // console.log(A,"正在进行子前缀计算");
            // console.log("节点：",this.tree[A].childNode);
            // console.log("树：",this.tree);

            //因为虚节点没有相机属性，自然不算作有效节点
            if(!this.has(A))return;
            //父节点
            const parentNode=this.getParentNode(A);
            //父节点数据；如果父节点不存在，用默认相机属性；如果存在，正常获取
            const parentNodeData=!this.has(parentNode)?new Camera():this.tree[parentNode].data;
            
            //子节点数据
            const childNodeData=this.tree[A].data;
            //带入
            const obj=computeDirectTransformation(childNodeData,parentNodeData);
            //返回并设置
            childNodeData.optimization_ox=obj.optimization_ox;
            childNodeData.optimization_oy=obj.optimization_oy;
            childNodeData.optimization_xx=obj.optimization_xx;
            childNodeData.optimization_xy=obj.optimization_xy;
            childNodeData.optimization_yx=obj.optimization_yx;
            childNodeData.optimization_yy=obj.optimization_yy;
            childNodeData.optimization_od=obj.optimization_od;
            childNodeData.optimization_os=obj.optimization_os;
            //遍历
            for(const it of this.tree[A].childNode)this.dfs_childNode_computeDirectTransformation(it);
        }
    }

    //数据
    class Camera{
        constructor(x=0,y=0,d=90,s=100,RFCx=0,RFCy=0,RFCd=90,RFCs=100){
            this.x=x;
            this.y=y;
            this.d=d;
            this.s=s;
            this.RFCx=RFCx;
            this.RFCy=RFCy;
            this.RFCd=RFCd;
            this.RFCs=RFCs;

            //优化
            //不能发现，无论相机树的变换多么复杂，从一个节点渲染到舞台的一系列变化可以用一次变换概括
            //不能发现，只需要确定(0,0)节点到舞台的坐标ox,oy，再分别求出x,y相机向量分别对于舞台x,y的贡献
            //即xx,xy,yx,yy单位缩放分量(ab表示a分量对b向量的贡献)
            //最多求三次就可以计算出分量和原点变换了
            //之后角色只需要简单将tx,ty用公式：
            //x'=ox+(xx*tx+yx*ty);
            //y'=oy+(xy*tx+yy*ty);
            //即可求出直接渲染到舞台的坐标
            //方向和大小就更加简单了，直接带入原点或者单位一计算就行了
            
            //以下是舞台的参数，用于相机不存在时的默认渲染参数。
            this.optimization_ox=0;
            this.optimization_oy=0;
            this.optimization_xx=1;
            this.optimization_xy=0;
            this.optimization_yx=0;
            this.optimization_yy=1;
            this.optimization_od=0;
            this.optimization_os=1;
        }
        //相机变换，返回点对象
        cameraChange(dot=new Dot()){
            const tempDot=new Dot(dot.x-this.x,dot.y-this.y,dot.d,dot.s);
            const origin=new Dot(this.RFCx,this.RFCy,90-(this.d-90)+(this.RFCd-90),this.RFCs*(100/this.s));
            //带入变换函数
            return coordinateTransformation(tempDot,origin);
        }
        //跳跃分量计算，返回点对象
        computeJump(dot=new Dot()){
            const newdot=new Dot();
            newdot.x=this.optimization_ox+(this.optimization_xx*dot.x+this.optimization_yx*dot.y);
            newdot.y=this.optimization_oy+(this.optimization_xy*dot.x+this.optimization_yy*dot.y);
            newdot.d=this.optimization_od+dot.d;
            newdot.s=this.optimization_os*dot.s;
            return newdot;
        }
        
    }
    
    //计算分量，并且返回跳跃渲染参数对象（A是需要计算分量的节点，B是已经存在了的可以直接用的节点）
    function computeDirectTransformation(CameraA=new Camera(),CameraB=new Camera()){
        //原点参考点
        let dot_0=CameraA.cameraChange(new Dot(0,0,90,100));
        //同时计算x分量，方向零点，大小缩放比（可以证明它们没有直接关联）
        let dot_1=CameraA.cameraChange(new Dot(1,0,0,1));
        //只计算y分量（因为如果同时计算x、y分量会导致分量贡献叠加）
        let dot_2=CameraA.cameraChange(new Dot(0,1,90,100));
        dot_0=CameraB.computeJump(dot_0);
        dot_1=CameraB.computeJump(dot_1);
        dot_2=CameraB.computeJump(dot_2);
        const optimization_ox=dot_0.x;//原点x
        const optimization_oy=dot_0.y;//原点y
        const optimization_xx=dot_1.x-dot_0.x;//x分量对x的贡献
        const optimization_xy=dot_1.y-dot_0.y;//x分量对y的贡献
        const optimization_yx=dot_2.x-dot_0.x;//y分量对x的贡献
        const optimization_yy=dot_2.y-dot_0.y;//y分量对y的贡献
        const optimization_od=dot_1.d;//方向原点
        const optimization_os=dot_1.s;//缩放原点（应该是单位一的缩放比）
        return{
            optimization_ox:optimization_ox,
            optimization_oy:optimization_oy,
            optimization_xx:optimization_xx,
            optimization_xy:optimization_xy,
            optimization_yx:optimization_yx,
            optimization_yy:optimization_yy,
            optimization_od:optimization_od,
            optimization_os:optimization_os
        }
    }

    //用分量计算实际坐标，返回点对象
    function computeJumpRendererDot(dot=new Dot(),CameraA=new Camera()){
        const optimization_ox=CameraA.optimization_ox;
        const optimization_oy=CameraA.optimization_oy;
        const optimization_xx=CameraA.optimization_xx;
        const optimization_xy=CameraA.optimization_xy;
        const optimization_yx=CameraA.optimization_yx;
        const optimization_yy=CameraA.optimization_yy;
        const optimization_od=CameraA.optimization_od;
        const optimization_os=CameraA.optimization_os;
        const newdot=new Dot();
        newdot.x=optimization_ox+(optimization_xx*dot.x+optimization_yx*dot.y);
        newdot.y=optimization_oy+(optimization_xy*dot.x+optimization_yy*dot.y);
        newdot.d=optimization_od+dot.d;
        newdot.s=optimization_os*dot.s;
        return newdot;
    }

    //相机树
    const CameraTree=new CamerasTree();

    function getTargetThroughDrawableID(drawableID){
        return runtime.targets.find(it=>it.drawableID===drawableID);
    }

    //相机渲染
    function CameraRenderer(target,dot=new Dot()){
        //开启优化，用新的概括方法
        if(isOptimization.getCurrent()){
            const camera=getSpriteData(target,AssociatedCamera);
            const data=CameraTree.has(camera)?CameraTree.getData(camera):new Camera();
            return computeJumpRendererDot(dot,data);
        }
        //未开启优化，用旧的暴力上浮方法
        else{
            let newDot=dot;
            let camera=getSpriteData(target,AssociatedCamera);
            while(CameraTree.has(camera)){
                //相机属性
                const data=CameraTree.getData(camera);
                //带入变换函数
                newDot=data.cameraChange(newDot);
                //下一个相机
                camera=CameraTree.getParentNode(camera);
            }
            return newDot;
        }
    }

    //渲染器方法重写

    //坐标
    const ogUpdatePosition=renderer.exports.Drawable.prototype.updatePosition;
    renderer.exports.Drawable.prototype.updatePosition=function(position){
        const target=getTargetThroughDrawableID(this._id);
        const dot=CameraRenderer(target,new Dot(position[0],position[1]));
        position[0]=dot.x;
        position[1]=dot.y;
        if(target&&typeof target==="object"){
            target[rendererX]=dot.x;
            target[rendererY]=dot.y;
        }
        ogUpdatePosition.call(this,position);
    }
    
    //方向
    const ogUpdateDirection=renderer.exports.Drawable.prototype.updateDirection;
    renderer.exports.Drawable.prototype.updateDirection=function(direction){
        const target=getTargetThroughDrawableID(this._id);
        const dot=CameraRenderer(target,new Dot(0,0,direction));
        direction=dot.d;
        if(target&&typeof target==="object")target[rendererD]=dot.d;
        ogUpdateDirection.call(this,direction);
    }
    
    //大小
    const ogUpdateScale=renderer.exports.Drawable.prototype.updateScale;
    renderer.exports.Drawable.prototype.updateScale=function(scale){
        const target=getTargetThroughDrawableID(this._id);
        const dot=CameraRenderer(target,new Dot(0,0,90,1));
        const sum=scale.reduce((acc,it,idx)=>acc+=scale[idx]=it*dot.s,0);
        if(target&&typeof target==="object")target[rendererS]=dot.s*100;
        ogUpdateScale.call(this,scale);
    }

    //外观积木的对话框
    const ogPositionBubble=runtime.ext_scratch3_looks._positionBubble;
    runtime.ext_scratch3_looks._positionBubble=function(target){
        const ogNativeSize=renderer._nativeSize;
        renderer._nativeSize=[Infinity,Infinity];
        ogPositionBubble.call(this,target);
        renderer._nativeSize=ogNativeSize;
    };

    //渲染角色
    function rendnererTarget(target){
        const drawable=renderer._allDrawables[target.drawableID];
        drawable.updatePosition([target.x,target.y]);
        drawable.updateDirection(target.direction);
        drawable.updateScale([target.size,target.size]);
        //对话框
        //通过一个简单的逆向，发现内部会调用 this._getBubbleState(target) 方法
        //如果角色没有对话框，那 this._getBubbleState(target).drawableId 就会返回null
        //如果用null去处理对话框数据，内部会报错
        //为了避免报错，所以提前检测
        const ext_scratch3_looks=runtime.ext_scratch3_looks;
        if(ext_scratch3_looks._getBubbleState(target).drawableId!==null)ext_scratch3_looks._positionBubble.call(ext_scratch3_looks,target);
    }

    class CameraPro{
        constructor(){

        }
        getInfo(){
            return{
                id:ExtensionsName,
                name:"多相机",
                color1:"#517af5",
                color2:"#3460e3",
                color3:"#2851c9",
                blocks:[
                    {
                        blockType:Scratch.BlockType.LABEL,
                        text:"Tips：",
                    },
                    {
                        blockType:Scratch.BlockType.LABEL,
                        text:"该功能目前还在测试",
                    },
                    {
                        blockType:Scratch.BlockType.LABEL,
                        text:"额外的计算在部分情况下",
                    },
                    {
                        blockType:Scratch.BlockType.LABEL,
                        text:"可能导致逆优化",
                    },
                    {
                        blockType:Scratch.BlockType.LABEL,
                        text:"请尝试对比实际性能损耗再做决定",
                    },
                    {
                        opcode:"switchOptimization",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"[OFForON] 相机渲染优化？",
                        arguments:{
                            OFForON:{
                                type:Scratch.ArgumentType.STRING,
                                menu:"OFForON"
                            },
                        }
                    },
                    "---",
                    {
                        opcode:"clearCamera",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"删除所有相机",
                        arguments:{}
                    },
                    {
                        opcode:"bindCamera",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"构造相机 [CameraA] 并绑定父相机 [CameraB]",
                        arguments:{
                            CameraA:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:"相机"
                            },
                            CameraB:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:""
                            }
                        }
                    },
                    {
                        opcode:"deleteCamera",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"删除相机 [CameraA]",
                        arguments:{
                            CameraA:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:"相机"
                            }
                        }
                    },
                    {
                        opcode:"editCamera",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"更新相机 [CameraA] 的 [key] 为 [value]",
                        arguments:{
                            CameraA:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:"相机"
                            },
                            key:{
                                type:Scratch.ArgumentType.STRING,
                                menu:"CameraArguments"
                            },
                            value:{
                                type:Scratch.ArgumentType.NUMBER,
                                defaultValue:0
                            },
                        }
                    },
                    {
                        opcode:"hasCamera",
                        blockType:Scratch.BlockType.BOOLEAN,
                        text:"相机 [CameraA] 存在?",
                        arguments:{
                            CameraA:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:"相机"
                            }
                        }
                    },
                    {
                        opcode:"bindCameraValid",
                        blockType:Scratch.BlockType.BOOLEAN,
                        text:"相机 [CameraA] 能绑定父相机 [CameraB] ?",
                        arguments:{
                            CameraA:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:"相机"
                            },
                            CameraB:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:""
                            }
                        }
                    },
                    {
                        opcode:"getCamera",
                        blockType:Scratch.BlockType.REPORTER,
                        text:"相机 [CameraA] 的 [key]",
                        arguments:{
                            CameraA:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:"相机"
                            },
                            key:{
                                type:Scratch.ArgumentType.STRING,
                                menu:"CameraArguments"
                            }
                        }
                    },
                    "---",
                    {
                        opcode:"setSpriteCamera",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"当前角色所属相机设为 [CameraA]",
                        arguments:{
                            CameraA:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:"相机"
                            }
                        },
                        filter:[Scratch.TargetType.SPRITE]
                    },
                    {
                        opcode:"getSpriteCamera",
                        blockType:Scratch.BlockType.REPORTER,
                        text:"当前角色所属相机",
                        arguments:{},
                        filter:[Scratch.TargetType.SPRITE]
                    },
                    {
                        opcode:"getSpriteAttributeRendererValue",
                        blockType:Scratch.BlockType.REPORTER,
                        text:"角色的渲染 [attribute]",
                        arguments:{
                            attribute:{
                                type:Scratch.ArgumentType.STRING,
                                menu:"AttributeArguments"
                            }
                        },
                        filter:[Scratch.TargetType.SPRITE]
                    },
                    "---",
                    {
                        opcode:"debug",
                        blockType:Scratch.BlockType.REPORTER,
                        text:"debug [num]",
                        arguments:{
                            num:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:"1"
                            }
                        }
                    },
                    /*
                    {
                        opcode:"",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"",
                        arguments:{}
                    },
                    {
                        opcode:"",
                        blockType:Scratch.BlockType.REPORTER,
                        text:"",
                        arguments:{}
                    }
                    */
                ],
                menus:{
                    CameraArguments:[
                        {text:"x坐标",value:"x"},
                        {text:"y坐标",value:"y"},
                        {text:"方向",value:"d"},
                        {text:"大小",value:"s"},
                        {text:"架到父相机的x坐标",value:"RFCx"},
                        {text:"架到父相机的y坐标",value:"RFCy"},
                        {text:"架到父相机的方向",value:"RFCd"},
                        {text:"架到父相机的大小",value:"RFCs"},
                    ],
                    AttributeArguments:[
                        {text:"x坐标",value:"x"},
                        {text:"y坐标",value:"y"},
                        {text:"方向",value:"d"},
                        {text:"大小",value:"s"},
                    ],
                    OFForON:[
                        {text:"开启",value:"true"},
                        {text:"关闭",value:"false"}
                    ],
                }
            }
        }
        switchOptimization(args,util){
            const OFForON=toString(args.OFForON)==="true";

            //设置状态
            isOptimization.set(OFForON);
            //状态是上升趋势？
            if(isOptimization.isUpward()){
                //直接就是一个全部初始化
                CameraTree.dfs_parentNode_computeDirectTransformation();
            }
            //状态是下降趋势？
            if(isOptimization.isDownward()){
                
            }
            //为了对比是否正确，强行重新计算所有角色的渲染坐标
            const targets=CameraTree.getTargets();
            console.log(targets);
            targets.forEach(it=>rendnererTarget(it));
        }
        clearCamera(args,util){
            
            CameraTree.clear();

            CameraTree.getTargets().forEach(it=>rendnererTarget(it));
        }
        bindCamera(args,util){
            const CameraA=toString(args.CameraA);
            const CameraB=toString(args.CameraB);

            CameraTree.addNode(CameraA,CameraB);

            //优化功能
            //如果当前是开启状态，就将子树计算新的跳跃分量
            if(isOptimization.getCurrent()){
                CameraTree.dfs_childNode_computeDirectTransformation(CameraA);
            }

            CameraTree.getTargets(CameraA).forEach(it=>rendnererTarget(it));
        }
        deleteCamera(args,util){
            const CameraA=toString(args.CameraA);

            if(CameraTree.has(CameraA)){
                const targets=CameraTree.getTargets(CameraA);

                //优化功能
                const childNode=CameraTree.tree[CameraA].childNode;

                CameraTree.deleteNode(CameraA);
                
                //优化功能
                //如果当前是开启状态，就将子树计算新的跳跃分量
                if(isOptimization.getCurrent()){
                    for(const it of childNode)CameraTree.dfs_childNode_computeDirectTransformation(it);
                }

                targets.forEach(it=>rendnererTarget(it));
            }
        }
        editCamera(args,util){
            const CameraA=toString(args.CameraA);
            const key=toString(args.key);
            const value=toNumber(args.value);

            if(!CameraTree.has(CameraA))return;

            const data=CameraTree.getData(CameraA);
            data[key]=value;
            CameraTree.setData(CameraA,data);

            //优化功能
            //如果当前是开启状态，就将子树计算新的跳跃分量
            if(isOptimization.getCurrent()){
                CameraTree.dfs_childNode_computeDirectTransformation(CameraA);
            }

            CameraTree.getTargets(CameraA).forEach(it=>rendnererTarget(it));
        }
        hasCamera(args,util){
            const CameraA=toString(args.CameraA);

            return CameraTree.has(CameraA);
        }
        bindCameraValid(args,util){
            const CameraA=toString(args.CameraA);
            const CameraB=toString(args.CameraB);

            return CameraTree.addNodeValid(CameraA,CameraB);
        }
        getCamera(args,util){
            const CameraA=toString(args.CameraA);
            const key=toString(args.key);

            if(CameraTree.has(CameraA))return CameraTree.getData(CameraA)[key];
            return"";
        }
        setSpriteCamera(args,util){
            const CameraA=toString(args.CameraA);

            const target=util.target;

            //如果是舞台，不执行任何操作
            if(target.isStage)return;

            //断掉前连接
            CameraTree.unBindData(getSpriteData(target,AssociatedCamera),target);
            //建立新连接
            CameraTree.bindData(CameraA,target);
            setSpriteData(target,AssociatedCamera,CameraA);

            //渲染
            rendnererTarget(target);
        }
        getSpriteCamera(args,util){

            const target=util.target;
            
            //如果是舞台，返回空字符串
            if(target.isStage)return"";

            return getSpriteData(target,AssociatedCamera);
        }
        getSpriteAttributeRendererValue(args,util){
            const attribute=toString(args.attribute);
            
            const target=util.target;

            //如果是舞台，返回空字符串
            if(target.isStage)return"";

            const value=attribute==="x"?getSpriteData(target,rendererX):
                        attribute==="y"?getSpriteData(target,rendererY):
                        attribute==="d"?getSpriteData(target,rendererD):
                        attribute==="s"?getSpriteData(target,rendererS):
                        undefined;
            return value===undefined?"":value;
        }
        debug(args,util){
            const num=toString(args.num);

            if(false);
            else if(num==="1")return JSON.stringify(CameraTree,null,2);
            else if(num==="2")return JSON.stringify(CameraTree.out(),null,2);
            else if(num==="3")return JSON.stringify(CameraTree.getTargets().map(it=>it.id),null,2);
            return"";
        }
    }
    Scratch.extensions.register(new CameraPro());
})(Scratch);