// Name: 局部变量扩展 / ...
// ID: LocalVariableExtensions
// Description: TurboWarp版的局部变量扩展，借鉴/改编 自CCW社区的 Arkos 的扩展 / ...
// By: 无心小白僵尸 / Wxxbjs | CCW社区的 Arkos | 所有前作者 / ...
// License: 继承 | 未定义？（源码并没有写什么协议） | 比 MIT 更宽松的协议（前者都不满足的默认情况） / ...
// Scratch-compatible: false
// Extended version: v0.4.8

/* 事先声明：
 *
 * 借鉴/改编声明：
 * 该扩展参考自CCW社区的 Arkos 的“局部变量”扩展源码
 * CCW社区的 Arkos 的“局部变量”扩展源码的来源是 CCW社区 的 素材集市 的 扩展 分区中可查找到的（至少截止到获取源码时日期） 公开的扩展源码 
 * 本人并没有用非法手段获取
 * 
 * 看到源码有一些开发者信息，于是就直接摘录了
 * collaboratorList: [
       {
           collaborator: 'SimonShiki @ ClipCC',
           collaboratorURL: 'https://github.com/SimonShiki',
       },
       {
           collaborator: 'Skyhigh173',
           collaboratorURL: 'https://github.com/Skyhigh173',
       },
       {
           collaborator: 'Arkos(搬运者) @ CCW',
           collaboratorURL: 'https://www.ccw.site/student/6107c5323e593a0c25f850f8',
       },
       {
           collaborator: 'Wxxbjs(参考)',
           collaboratorURL: 'https://github.com/Wxxbjs',
       },
   ]
 * 
 * 扩展本身的声明：
 * 该扩展只考虑到TurboWarp编辑器环境
 * 该扩展并不保证和 CCW社区 或者 其他社区 的类似扩展兼容，只保证核心功能类似
 * 使用该扩展后导致作品损坏、作品丢失
 * 如果不是扩展本身的目的问题，本人不承担任何责任
 * 
 * 使用本扩展则默认你阅读并接受了以上内容
*/

/* 更新 Tips:
 * - v0.0.0：
     完成非编译行为
 * - v0.1.0：
     完成编译行为
     （布什各门这么复杂的功能且期间那么多的发现就用一句话概括了？）
     （好吧，确实。（绷））
     （具体实现花费一天时间。如果算上思考时间和前置摸索，那么两周以内是有的。）
     目前来看，似乎是支持动态变量名的
     但是对于纯静态变量名来说，并没有用到js原生的变量语法，性能会差一点

     不过如果真的要将静态变量名硬编码进脚本里，那么争议就更大了：
     如果动态变量名的返回结果是静态变量名，那么此时怎么判定是硬编码变量名还是存储对象中的属性？
     而且就算我知道动态变量名的返回结果是之前硬编码的定义，但是怎么访问和修改？
     查了一下资料，js原生支持一定程度上的动态访问jv原生语法的变量
     性能损耗比较严重，但是比对象访问快。
     而且还有安全问题。
     嗯……这是一个值得权衡的问题。
     不好处理。
     还是建议用静态而不用动态。配合优化差不多就很快了。
 * - v0.1.2：
     修复非编译模式下，最外层的局部变量（存储线程到线程中）访问不到的bug
     还有一些不痛不痒的更新：
     整理，写了点注释，删了点注释，简写了点代码，然后就没了
 * - v0.1.4：
     修复编译模式下动态变量行为可能不一样的bug
     因为之前是反复嵌入参数的js表达式，如果该表达式是同输入不定输出，即多次调用该表达式的输出不一样，那么行为就不一样了
     优化逻辑，编译后的代码不再反复声明同一个函数，更加优雅和精简
 * - v0.2.4：
     新增全新的纯静态模式
     之前默认采用动态模式（原理是对象作用域，以键为变量名存储），性能低效（比js原生动态获取变量名的语法还慢）
     现在只要保证整个积木段的变量名都是字面量（不可填入任何积木）即可触发静态模式
     静态模式直接使用js原生的变量语法进行编译（处理了一些定义和使用混淆的情况）
     所以性能比动态模式快的不是一个量级
     未来可能会加入内置局部变量的循环积木。
     预计重构内部设计。（主要是循环是双局部域，现有单栈帧对应单局部域的设计有点难搞）
 * - v0.3.5：
     重构整个作用域设计，将单帧对单作用域的设计改为单帧对作用域对象数组（也可以叫作用域栈）
     单个栈栈内的访问顺序和栈一样，从上往下
     同时三种模式都适配了这种设计（解释模式篡改循环方法，只清空作用域栈的栈顶，因为要为循环留接口）
     这种设计的好处在于可以实现类似插入作用域的行为，比如传统编程语言的循环的隐式双作用域设计
     这样写循环积木的时候就没那么坐牢了。
     功能没什么变化，主要是内核的改变。
     修复解释模式下自制积木越过积木段访问局部变量的问题（这玩意怎么一直没发现。从v0.0.0遗留到现在。）
 * - v0.3.5：
     没什么功能改动，主要调整注释和注释一些不必要的console.log()，简化代码
 * - v0.4.5：
     更新准备已久的内置局部变量的循环积木！
     而且之前留的接口非常好，写起来一点都不坐牢，非常顺利
 * - v0.4.7：
     修复因篡改后注入的代码不是永恒最高的导致的bug
     修复扩展的循环积木没有的隐式帧让步功能bug
     优化部分逻辑
 * - v0.4.8：
     修复v0.3.5重构作用域设计时就存在的问题：栈顶删除的属性和实际采用的属性名不一致的问题
     好家伙之前一直没测试过作用域。竟然没发现。
     整改注入函数，更加通用
*/

/* 设计Tips：
 * - 定义和使用的混淆：
     不管怎样，我一般是这么认为两种模式的
     - 明确定义，强型声明
     - 中途使用，弱型修改
     声明模式下一定是所处的作用域（父栈帧）存储（有的时候还不能重复在一个同样的作用域内声明）
     修改模式下一定是优先查找所处作用域和更外围的若干作用域（如果没有，在不报错的系统下直接视为强定义）
     其他的都是变体
     下面三种模式行为（解释模式，编译模式但动态变量名模式，编译模式但静态变量名模式）都很好的体现了这种设计，行为统一
 * - - 特例演示：
       形如：
       “
        let i=0;
        {
            i=1;
            let i=2;
            console.log(i);
        }
        console.log(i);
       ”
       的语法，显然这在js中就是语法错误，反人类直觉的写法，但是从解释模式和动态模式下看，似乎和：
       “
        let a_i=0;
        {
            a_i=1;
            let b_i=2;
            console.log(b_i);
        }
        console.log(a_i);
       ”
       这种明确告知变量的引用的到底那个作用域一致
       而且这也符合栈帧覆盖语法，常规修改只影响第一个找到的变量，而定义是强定义
       或者将定义理解强断点，使用是必须访问第一个断点层，并且明确声明是哪里拿到的变量即可
       而解释模式和动态模式模糊了这种设计（因为未定义前只能查到上一个名字的变量，而声明又是父栈帧强行写入）
*/

(function(Scratch){
    "use strict";

     // 更多类型侦测
    function type(value) {
        if(value===null)return"null";
        if(value===undefined)return"undefined";
        if(value instanceof Map)return"map";
        if(value instanceof Set)return"set";
        if(value instanceof Date)return"date";
        if(value instanceof Array)return"array";
        if(value instanceof RegExp)return"regexp";
        if(value instanceof Function)return"function";
        return typeof value;
    }

    //及其深度拷贝对象，调试友好
    //考虑到循环引用，所以用Map存储，原对象映射新对象，到时候自己构造自己
    function deepCopy(obj,visited=new Map()){
        if(visited.has(obj))return visited.get(obj);
        const op=type(obj);
        if(op==="object"){
            const newObj={};
            visited.set(obj,newObj);
            [...Object.getOwnPropertyNames(obj),...Object.getOwnPropertySymbols(obj)].forEach(it=>newObj[deepCopy(it,visited)]=deepCopy(obj[it],visited));
            return newObj;
        }
        else if(op==="array"){
            const newObj=[];
            visited.set(obj,newObj);
            obj.forEach(it=>newObj.push(deepCopy(it,visited)));
            return newObj;
        }
        else if(op==="map"){
            const newMap=new Map();
            visited.set(obj,newMap);
            obj.forEach((value,key)=>newMap.set(deepCopy(key,visited),deepCopy(value,visited)));
            return newMap;
        }
        else if(op==="set"){
            const newSet=new Set();
            visited.set(obj,newSet);
            obj.forEach(it=>newSet.add(deepCopy(it,visited)));
            return newSet;
        }
        else if(op==="regexp")return new RegExp(obj.source,obj.flags);
        else if(op==="date")return new Date(obj);
        else return obj;
    }
    
    const Cast=Scratch.Cast;
    const vm=Scratch.vm;
    const runtime=vm.runtime;

    const localVariable=Symbol("localVariable");//非编译模式时，上下文信息的唯一属性名
    const localVariable_loopInit=Symbol("localVariable_loopInit");//非编译模式时，循环积木的唯一属性

    const ExtensionsName="LocalVariableExtensions";
    function toString(value){return Cast.toString(value)};
    function toNumber(value){return Cast.toNumber(value)};

    class Scope{
        constructor(scopeName,variables){
            this.scopeName=scopeName;
            this.variables=variables;
        }
    }

    //完整的作用域对象：
    // struct scope{
    //     scopeName:string,
    //     variables:object<string,any>|set<string>|null // 因为有可能需要运行时表示，有的可能只需要变量名即可，有的只是用了作用域的名字，与变量无关
    // }
    //栈帧存储的作用域的行为：
    // stackFrame[symbol(key)]=array<scope>

    //注意了，尽可能选择 会随积木一同出现一同消失 的东西
    //比如解释模式下的栈帧的上下文属性，而一定不能用栈帧对象
    //因为scr有点聪明但不多，会重置每一个独立的积木的上下文属性，但是栈帧会复用
    //如果没有随积木的东西，就 尽可能 篡改栈帧的加入和行为
    //如果是在不行，就强捕获每一个积木作为栈顶的行为，然后不管怎样删除作用域对象即可（要注意篡改后新增代码的优先级是否一定是最高的）
    //如果仍然不行，考虑自己维护（栈帧和作用域分离，这个设计我考虑过，但是有点麻烦且现有方法能解决上述问题我就没用了。）
    //如果还不行，那就别写了，这个诡异的生态不适合你为此付出时间和精力。

    //解释器模式行为
    
    //非编译模式下，循环内创建的变量下次循环仍能使用
    //在循环中，每次循环并不会创建全新的栈帧，所以上一次的局部变量仍然被可以使用
    //所以将原方法篡改，每执行一次循环就清空一次存储
    const sequencer=runtime.sequencer;
    const origStepBranch=sequencer.stepToBranch;
    sequencer.stepToBranch=function(thread,branchNum,isLoop,...args){
        //是循环
        if(isLoop){
            //获取栈帧
            const stackFrame=thread.peekStackFrame();
            //获取上下文信息
            const executionContext=stackFrame.executionContext
            //判断是否有值，如果有就清空为空对象
            if(executionContext&&typeof executionContext==="object"&&executionContext[localVariable])executionContext[localVariable].at(-1).variables=Object.create(null);
        }
        //执行原逻辑
        return origStepBranch.call(this,thread,branchNum,isLoop,...args);
    };

    //获取栈帧
    function getStackFrames(thread){
        return[thread,...thread.stackFrames];
    }

    //获取局部变量存放的对象，如果没有就创建新的
    function getLocalVariableObj(variable,thread,idx=2){
        //获取线程的栈帧
        const stackFrames=getStackFrames(thread);
        // console.log(deepCopy(stackFrames));
        //遍历栈帧,因为栈顶是当前积木，所以应该从第倒数二个开始搜索
        for(let i=stackFrames.length-idx;i>=0;--i){
            //单帧
            const stackFrame=stackFrames[i];
            //上下文
            const executionContext=stackFrame?.executionContext
            //积木opcode
            const opcode=stackFrame?.op?.opcode;
            //上下文合法且存在作用域对象数组
            if(executionContext&&typeof executionContext==="object"&&executionContext[localVariable]){
                const scopes=executionContext[localVariable];
                //遍历作用域数组，还是按照帧顺序从高到第访问
                for(let i=scopes.length-1;i>=0;--i){
                    //判断，如果上下文存储对象存放了这个，就返回这个上下文存储对象
                    if(variable in scopes[i].variables)return scopes[i].variables;
                }
            }
            //是自制积木的上下文，不用往后查了
            //因为自制积木应该是一个独立的作用域，不然可能会篡改函数外的局部变量，那就更不对了
            if(opcode==="procedures_call")return createLocalVariableObj(thread);
        }
        //完全没有，新建
        return createLocalVariableObj(thread);
    }

    //创建新的作用域存放对象，同时返回存储对象
    //此函数有一个特殊的参数pd，表示是否是真追加（即真新建），默认pd为false，即只要有作用域对象就用，不强新建
    function createLocalVariableObj(thread,pd=false,idx=2){
        //获取线程的栈帧
        const stackFrames=getStackFrames(thread);
        //获取单个栈帧
        const stackFrame=stackFrames.at(-idx);
        //上下文对象
        if(!stackFrame.executionContext||typeof stackFrame.executionContext!=="object")stackFrame.executionContext={};
        //指向上下文
        const executionContext=stackFrame.executionContext;
        //数组
        if(!executionContext[localVariable])executionContext[localVariable]=[];
        //指向数组
        const scopes=executionContext[localVariable];
        //必须有至少一个，或者pd强新建
        if(pd||scopes.length===0)scopes.push(new Scope("scope",Object.create(null)));
        //返回最后一个作用域对象
        return scopes.at(-1).variables;
    }

    class LocalVariableExtensions{
        constructor(){
            //执行编译逻辑
            this.patchCompiler();
        }
        getInfo(){
            return{
                id:ExtensionsName,
                name:"局部变量扩展",
                color1:"#809fff",
                color2:"#6c87d9",
                color3:"#5970b3",
                blocks:[
                    {
                        opcode:"localDomain",
                        blockType:Scratch.BlockType.CONDITIONAL,
                        text:["局部域"],
                        arguments:{},
                        branchCount:1
                    },
                    {
                        opcode:"declareVariable",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"声明局部变量 [variable] 设为 [value]",
                        arguments:{
                            variable:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:"i"
                            },
                            value:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:0
                            }
                        }
                    },
                    {
                        opcode:"editVariable",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"局部变量 [variable] 设为 [value]",
                        arguments:{
                            variable:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:"i"
                            },
                            value:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:0
                            }
                        }
                    },
                    {
                        opcode:"addVariable",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"局部变量 [variable] 增加 [value]",
                        arguments:{
                            variable:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:"i"
                            },
                            value:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:1
                            }
                        }
                    },
                    {
                        opcode:"getVariable",
                        blockType:Scratch.BlockType.REPORTER,
                        text:"局部变量 [variable]",
                        arguments:{
                            variable:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:"i"
                            }
                        }
                    },
                    {
                        opcode:"range",
                        blockType:Scratch.BlockType.LOOP,
                        text:["重复执行 [num] 次，以 [variable] 为计数器"],
                        arguments:{
                            num:{
                                type:Scratch.ArgumentType.NUMBER,
                                defaultValue:10
                            },
                            variable:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:"i"
                            }
                        }
                    },
                    "---",
                    {
                        opcode:"debugLog",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"log [str]",
                        arguments:{
                            str:{
                                type:Scratch.ArgumentType.STRING,
                                defaultValue:""
                            }
                        }
                    },
                    {
                        opcode:"compilerdebug",
                        blockType:Scratch.BlockType.COMMAND,
                        text:"断点",
                        arguments:{}
                    }
                ]
            }
        }
        //编译优化
        patchCompiler(){
            const dangerousExports=Scratch.vm.exports?.i_will_not_ask_for_help_when_these_break?.();
            //没有编译器就不编译
            if(!dangerousExports)return;
            const ASTGeneratorStub=dangerousExports.ScriptTreeGenerator;
            const JSGeneratorStub=dangerousExports.JSGenerator;
            const TypedInput=JSGeneratorStub.unstable_exports.TypedInput;
            const TYPE_UNKNOWN=JSGeneratorStub.unstable_exports.TYPE_UNKNOWN;

            /* 冷知识：
             * dangerousExports.JSGenerator返回的类其实是JSGeneratorStub而不是JSGenerator
             * JSGeneratorStub类可在tw源码的 scratch-vm-develop\src\compiler\old-compiler-compatibility.js 中找到
             * JSGenerator则是存放在 scratch-vm-develop\src\compiler\jsgen.js 中
             * 这两个类略有不同
             * 而且你通常无法轻易篡改到popFrame和pushFrame两个方
             * 所以如果要手动管理时将非常麻烦，而且栈帧行为可能不稳定，而且只能看tw怎么实现
             * 不要混淆
            */

            const ASTGeneratorStub_dynamic=Symbol("ASTGeneratorStub_dynamic");

            //AST阶段，分析静态模式和动态模式，剩下的交给JSG处理和编译

            //处理块级积木
            const originalDescendStackedBlock=ASTGeneratorStub.prototype.descendStackedBlock;
            ASTGeneratorStub.prototype.descendStackedBlock=function(block){
                //检查积木，返回AST节点
                if(block.opcode===`${ExtensionsName}_localDomain`){
                    return{
                        kind:`${ExtensionsName}.localDomain`,
                        substack:this.descendSubstack(block,"SUBSTACK")
                    };
                }
                if(block.opcode===`${ExtensionsName}_declareVariable`){
                    const variable=this.descendInputOfBlock(block,"variable");
                    //关键，如果不是纯字面量节点就直接认为是有潜在动态的可能，标记一个跨越AST和JSG的对象（这里用this.script与自定义属性设为true，下面同理
                    if(variable.opcode!=="constant")this.script[ASTGeneratorStub_dynamic]=true;
                    return{
                        kind:`${ExtensionsName}.declareVariable`,
                        variable:variable,
                        value:this.descendInputOfBlock(block,"value")
                    };
                }
                if(block.opcode===`${ExtensionsName}_editVariable`){
                    const variable=this.descendInputOfBlock(block,"variable");
                    if(variable.opcode!=="constant")this.script[ASTGeneratorStub_dynamic]=true;
                    return{
                        kind:`${ExtensionsName}.editVariable`,
                        variable:variable,
                        value:this.descendInputOfBlock(block,"value")
                    };
                }
                if(block.opcode===`${ExtensionsName}_addVariable`){
                    const variable=this.descendInputOfBlock(block,"variable");
                    if(variable.opcode!=="constant")this.script[ASTGeneratorStub_dynamic]=true;
                    return{
                        kind:`${ExtensionsName}.addVariable`,
                        variable:variable,
                        value:this.descendInputOfBlock(block,"value")
                    };
                }
                if(block.opcode===`${ExtensionsName}_range`){
                    const variable=this.descendInputOfBlock(block,"variable");
                    if(variable.opcode!=="constant")this.script[ASTGeneratorStub_dynamic]=true;
                    return{
                        kind:`${ExtensionsName}.range`,
                        num:this.descendInputOfBlock(block,"num"),
                        variable:variable,
                        substack:this.descendSubstack(block,"SUBSTACK")
                    };
                }
                //调试积木
                if(block.opcode===`${ExtensionsName}_compilerdebug`)return{kind:`${ExtensionsName}.compilerdebug`};
                //其他积木交给原函数处理
                return originalDescendStackedBlock.call(this,block);
            };
            //处理输入积木
            const originalDescendInput=ASTGeneratorStub.prototype.descendInput;
            ASTGeneratorStub.prototype.descendInput=function(block){
                //同理
                if(block.opcode===`${ExtensionsName}_getVariable`){
                    const variable=this.descendInputOfBlock(block,"variable");
                    if(variable.opcode!=="constant")this.script[ASTGeneratorStub_dynamic]=true;
                    return{
                        kind:`${ExtensionsName}.getVariable`,
                        variable:variable
                    };
                }
                return originalDescendInput.call(this,block);
            };

            /* 一些逻辑：（Tips：现在代码的部分逻辑与注释对不上但是更优了）
             * - 脚本可以看作一个树，每个分支就是一个节点
             *   作用域就是节点对象，此时很明显可以用 深度+同级编号 描述一个作用域存放对象
             * - 核心思路就是将this，即编译对象存放两个东西：
             *   1. Map映射同级次数（自定义，是计数，不是下一个编号）
             *   2. frames的索引描述层级深度（tw维护的，这里我们定义：this是0级，frames[0]是1级，其他同理）
             *   每当创建一个新的局部域时，Map计数加一，同时获取作用域唯一名称
             * - 通过this[localVariable]和frames[x][localVariable]存放作用域唯一名称（非空或者非空字符串即存在），用原型链构造作用域关系
             *   到时候新建的作用域将继承第一个有效的父作用域，如果没有就将原型设为null
             * - 创建/修改/访问时：
             *   1. 创建：新建作用域对象（或者已经存在不创建），这里将直接取当前作用域对象
             *            将当前作用域对象的var属性直接设为value
             *   2. 修改：新建作用域对象（或者已经存在不创建），这里将直接取当前作用域对象
             *            从当前作用域原型和及其原型链上的对象查找第一个含有var的对象，如果没有就用当前的作用域
             *            修改其值
             *   3. 访问：以当前栈帧查找第一个有效局部域对象，如果没有就用null冒充一下（到时候特判一下就行了），
             *            读取其值，如果没有就返回空字符串
            */

            //生成唯一字符串属性名
            const JSGeneratorStub_SymbolName=`JSGeneratorStub_SymbolName_${ExtensionsName}`;
            //作用域对象唯一字符串前缀
            const JSGeneratorStub_localVariableStoreObject=`${JSGeneratorStub_SymbolName}_localVariableStoreObject`;
            //唯一函数名
            const JSGeneratorStub_functionName=`${JSGeneratorStub_localVariableStoreObject}_getKeyInObj`;
            //计数属性
            const JSGeneratorStub_localVariableIDcnt=Symbol("JSGeneratorStub_localVariableIDcnt");
            //弃用。
            // const JSGeneratorStub_localVariable=Symbol("JSGeneratorStub_localVariable");
            //初始化属性
            const JSGeneratorStub_initPD=Symbol("JSGeneratorStub_initPD");
            //栈帧数组属性
            const JSGeneratorStub_Object=Symbol("JSGeneratorStub_Object");

            //共享函数

            //获取栈帧（主要是懒，不想特殊区分this和frames）
            function JSGeneratorStub_getStackframes(obj){
                return[obj,...obj.frames];
            }

            //获取新的唯一ID，这里传入this，由this自己维护一个计数
            function JSGeneratorStub_getUniqueName(obj){
                //不存在计数对象，新建
                if(!(JSGeneratorStub_localVariableIDcnt in obj))obj[JSGeneratorStub_localVariableIDcnt]=0;
                //返回
                return`${JSGeneratorStub_localVariableStoreObject}_${++obj[JSGeneratorStub_localVariableIDcnt]}`;
            }

            //动态模式

            //尝试创建新的局部域（父栈帧数组末尾），返回{scopeName:作用域名称,pd:是否新建成功}
            //同样的，还有一个pd参数用来强新建，与解释模式类似
            function JSGeneratorStub_createLocalDomainUniqueName(obj,pd=false,idx=2){
                const stackframes=JSGeneratorStub_getStackframes(obj);
                //绝对先从父栈帧开始考虑
                const frame=stackframes[stackframes.length-idx];
                //新建标记
                let createDetectionPD=false;
                //数组
                if(!frame[JSGeneratorStub_Object])frame[JSGeneratorStub_Object]=[];
                //指向数组
                const scopes=frame[JSGeneratorStub_Object];
                //新建行为
                if(pd||scopes.length===0){
                    scopes.push(new Scope(JSGeneratorStub_getUniqueName(obj),null));
                    createDetectionPD=true;
                }
                //获取作用域的名字，同时附带是否是新建的
                return{scopeName:scopes.at(-1).scopeName,pd:createDetectionPD};
            }

            //获取倒数第num个作用域开始查找的第一个可存储对象的字符串名称，如果没有就返回“null”
            //idx表示从倒数第idx个栈帧开始
            function JSGeneratorStub_getLocalDomainFirstprototype(obj,idx=1,num=1){
                const stackframes=JSGeneratorStub_getStackframes(obj);
                //这里就是标准的遍历行为
                for(let i=stackframes.length-idx;i>=0;--i){
                    const frame=stackframes[i];
                    if(frame[JSGeneratorStub_Object]){
                        const scopes=frame[JSGeneratorStub_Object];
                        for(let j=scopes.length-1;j>=0;--j){
                            if(num>1)--num;
                            else return scopes[j].scopeName;
                        }
                    }
                }
                return"null";
            }

            //静态模式

            //查找整个栈帧是否出现了name的变量，如果没有出现，返回false的同时，顺便存储变量
            //op表示是否是纯粹查询，即不创建新的变量，默认不纯粹
            function JSGeneratorStub_CheckIfItExists(name,obj,op=false,idx=2){
                const stackframes=JSGeneratorStub_getStackframes(obj);
                //标准查询
                for(let i=stackframes.length-idx;i>=0;--i){
                    const frame=stackframes[i];
                    if(frame[JSGeneratorStub_Object]){
                        const scopes=frame[JSGeneratorStub_Object];
                        for(let j=scopes.length-1;j>=0;--j){
                            if(scopes[j].variables.has(name))return{pd:true,scopeName:scopes[j].scopeName};
                        }
                    }
                }
                if(!op)return JSGeneratorStub_CreateVariable(name,obj);
                return{pd:false,scopeName:null};//一般此时的scopeName没有用，因为纯粹查询只关心在不在，不在自然不会用到任何作用域
            }

            //返回当前父栈帧有没有存放变量，如果没有返回false，则顺便创建作用域存放变量
            //pd参数同理
            //op参数表示是否忽略name，直接创建作用域。
            //一般只和pd为true的时候用
            function JSGeneratorStub_CreateVariable(name,obj,pd=false,idx=2,op=false){
                const stackframes=JSGeneratorStub_getStackframes(obj);
                //绝对先从父栈帧开始考虑
                const frame=stackframes[stackframes.length-idx];
                //新建标记
                let createDetectionPD=true;
                //数组
                if(!frame[JSGeneratorStub_Object])frame[JSGeneratorStub_Object]=[];
                //数组指向
                const scopes=frame[JSGeneratorStub_Object];
                //创建逻辑
                if(pd||scopes.length===0)scopes.push(new Scope(JSGeneratorStub_getUniqueName(obj),new Set())),createDetectionPD=false;
                //单个作用域
                const scope=scopes.at(-1);
                //变量名存储新建
                if(!op&&!scope.variables.has(name)){
                    scope.variables.add(name);
                    createDetectionPD=false;
                }
                return{pd:createDetectionPD,scopeName:scope.scopeName};
            }

            //其实返回false就是let的时机，顺便而已
            //这两玩意返回的是一个对象{pd:查询结果,scopeName:给出这个结果的作用域的名称（可以理解为负责人）}
            //配合pd，直接scopeName和组合编码变量名可以有效避免一些来源不明的声明和使用，避免某些编译出来的代码是语法错误

            //变量名编码
            //至于为什么可以忽略字面量的类型直接编码，可以这么想：
            //既然全局都是字面量（纯输入节点），那么同样内容的字面量的类型必定是一样，因此无需区分是什么类型，直接编码准没错
            function JSGeneratorStub_encode(str){
                const chars="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
                let res="";
                for (let i=0;i<str.length;++i){
                    const code=str.charCodeAt(i);
                    res+=chars[Math.floor(code/3844)]+chars[Math.floor(code/62)%62]+chars[code%62];
                }
                return res;
            }
            
            //编译积木
            //防止某些扩展的不标准编译导致不编译作用域，我直接强制运用作用域。（可能不需要，但是怎么没效果）
            // const originalDescendStack=JSGeneratorStub.prototype.descendStack;
            // JSGeneratorStub.prototype.descendStack=function(...args){
            //     this.source+="{\n";
            //     originalDescendStack.call(this,...args);
            //     this.source+="}\n";
            // }

            //v0.4.7 : bug修复
            //因为篡改时机可能不是永恒最高的，因此需要动态注入
            //使用Object.defineProperty篡改

            //篡改对象属性行为的函数，使用函数闭包，隐藏内部变量
            //嗯对超级长难句函数名。
            //v0.4.8 : 行为更改
            //主要是整理成更加通用的写法，便于扩展间的逻辑
            //思路就是在对象内部添加独立的属性存储前置函数
            //这样就可以将前值函数与对象绑定，而不是每次都篡改一遍方法导致出问题了
            //定义一个前置函数的前缀字符串
            //注意由于前置函数的返回值通常无效，所以可以放心修改
            const FrontFunction="__FrontFunction__";
            function BindFuncValueOfKeyInObjectToPushTopCode(obj,key,func){
                //属性名构造
                const FrontFunction_Key=`${FrontFunction}${key}`;
                //如果已经有了前置函数，只需修改前置函数即可
                if(Object.prototype.hasOwnProperty.call(obj,FrontFunction_Key)){
                    const _FrontFunction_Key=obj[FrontFunction_Key];
                    obj[FrontFunction_Key]=function(...args){
                        _FrontFunction_Key.call(this,...args);
                        return func.call(this,...args);
                    }
                    return;
                }
                //否则就新建，直接指向func
                obj[FrontFunction_Key]=func;
                //存储最终返回的函数
                let tempFunc=obj[key];
                //修改
                Object.defineProperty(obj,key,{
                    get:function(){return tempFunc;},
                    set:function(newFunc){
                        //主逻辑
                        if(typeof newFunc==="function"){
                            tempFunc=function(...args){
                                obj[FrontFunction_Key].call(this,...args);
                                return newFunc.call(this,...args);
                            }
                        }
                        //小处理，不用谢。（不是）
                        else throw new TypeError(`${key} must be a function`);
                    },
                    configurable:true,
                    enumerable:true
                });
            };

            const JSGeneratorStub_initFunction=function(node){
                //注意到任何一个积木段栈帧至少有一项元素，而且每个块级别的积木肯定经过这个函数
                //而且每次tw编译不同积木段是采用的是不同的this对象
                //所以只要this里没有标记过就一定是第一个积木
                //所以一些需要初始化或者全局声明构造的东西可以放到这个逻辑下
                
                //不存在属性或者属性为false（肯定是不存在）
                if(!this[JSGeneratorStub_initPD]){
                    //动态模式
                    if(this.script[ASTGeneratorStub_dynamic]){
                        //上浮查找方法（找不到就返回原始对象）
                        this.source+=
                        `function ${JSGeneratorStub_functionName}(a,key){`+"\n"+
                        `    for(let obj=a;obj;obj=Object.getPrototypeOf(obj))if(Object.prototype.hasOwnProperty.call(obj,key))return obj;`+"\n"+
                        `    return a;`+"\n"+
                        `}`+"\n"
                    }
                    //静态模式
                    else{

                    }
                    //标记
                    this[JSGeneratorStub_initPD]=true;
                }

                //我服了，tw太懒了，每个同级frame不新建，而是直接设置新的参数
                //这就导致之前的frame的自定义属性没有被删除，就导致了一系列离谱的错误
                //长记性了，这玩意卡了我4小时。
                delete this.frames[this.frames.length-1][JSGeneratorStub_Object];
                //v0.4.6 :
                //我又服了。
                //怎么还有篡改时机的问题。
                //直接提升优先级。
            }

            BindFuncValueOfKeyInObjectToPushTopCode(JSGeneratorStub.prototype,"descendStackedBlock",JSGeneratorStub_initFunction);
            BindFuncValueOfKeyInObjectToPushTopCode(JSGeneratorStub.prototype,"descendInput",JSGeneratorStub_initFunction);
            //又长记性了。
            //怎么输入积木不清空也变量泄漏访问啊
            //这玩意卡了我15分钟。
            //v0.4.7 :
            //我又双叒叕服了。
            //直接提升优先级。
            //v0.4.8 ：
            //我又又双双叒叒叕叕服了。
            //怎么属性名不一样啊。
            //这都没发现吗。

            const originalDescendStackedBlockJS=JSGeneratorStub.prototype.descendStackedBlock;
            JSGeneratorStub.prototype.descendStackedBlock=function(node){

                //新建局部域
                if(node.kind===`${ExtensionsName}.localDomain`){
                    this.source+="{\n";
                    this.descendStack(node.substack,{
                        isLoop:false,
                        isLastBlock:false,
                    });
                    this.source+='}\n';
                    return;
                }
                //声明局部变量
                if(node.kind===`${ExtensionsName}.declareVariable`){

                    //获取variable和value的js表达式
                    const variable=this.descendInput(node.variable).asUnknown();
                    const value=this.descendInput(node.value).asUnknown();

                    //动态模式
                    if(this.script[ASTGeneratorStub_dynamic]){
                        //获取新局部域数据
                        const obj=JSGeneratorStub_createLocalDomainUniqueName(this);
                        const scopeName=obj.scopeName;
                        const pd=obj.pd;
                        //没有创建过局部域，就先声明一次
                        if(pd)this.source+=`const ${scopeName}=Object.create(${JSGeneratorStub_getLocalDomainFirstprototype(this,2,2)});\n`;
                        //设置（对象的设置总是在原型链的最低层，不会上浮查找，所以直接设置即可）
                        this.source+=`${scopeName}[${variable}]=${value};\n`;
                    }
                    //静态模式
                    else{
                        // console.log(deepCopy([this,this.frames]));

                        const encode_variable=JSGeneratorStub_encode(variable);
                        const obj=JSGeneratorStub_CreateVariable(encode_variable,this);
                        const pd=obj.pd;
                        const scopeName=obj.scopeName;
                        const variableName=`${scopeName}_${encode_variable}`;

                        // this.source+=`console.log("断点");\n`;

                        if(!pd)this.source+="let ";
                        this.source+=`${variableName}=${value}\n`;
                        //判断同父栈帧存不存在变量名，如果存在就不带let关键字赋值
                        //否则直接新建let
                        //判断当前父栈帧有没有，不然两个相同作用域的let变量会冲突
                    }
                    // this.source+=`console.log("断点");\n`;
                    return;
                }
                //修改局部变量
                if(node.kind===`${ExtensionsName}.editVariable`){

                    //获取variable和value的js表达式
                    const variable=this.descendInput(node.variable).asUnknown();
                    const value=this.descendInput(node.value).asUnknown();

                    //动态模式
                    if(this.script[ASTGeneratorStub_dynamic]){
                        //获取新局部域数据
                        const obj=JSGeneratorStub_createLocalDomainUniqueName(this);
                        const scopeName=obj.scopeName;
                        const pd=obj.pd;
                        //没有创建过局部域，就先声明一次
                        if(pd)this.source+=`const ${scopeName}=Object.create(${JSGeneratorStub_getLocalDomainFirstprototype(this,2,2)});\n`;
                        
                        //上浮逻辑（因为需要从底部向上浮动）
                        this.source+=`(function(variable){${JSGeneratorStub_functionName}(${scopeName},variable)[variable]=${value}})(${variable});\n`;
                    }
                    //静态模式
                    else{
                        // console.log(deepCopy([this,this.frames]));
                        
                        const encode_variable=JSGeneratorStub_encode(variable);
                        const obj=JSGeneratorStub_CheckIfItExists(encode_variable,this);
                        const pd=obj.pd;
                        const scopeName=obj.scopeName;
                        const variableName=`${scopeName}_${encode_variable}`;
                        // this.source+=`console.log("断点");\n`;
                        if(!pd)this.source+="let ";
                        this.source+=`${variableName}=${value}\n`;
                        //判断整个栈帧存不存在该变量，如果存在就不带let赋值
                        //带let就一定创建在当前父栈帧
                        //一般是直接用变量等于什么什么
                        //但是如果整个都不存在就必须let一下
                    }
                    return;
                }
                //增加局部变量
                if(node.kind===`${ExtensionsName}.addVariable`){
                
                    //获取variable和value的js表达式
                    const variable=this.descendInput(node.variable).asUnknown();
                    const value=this.descendInput(node.value).asUnknown();

                    //动态模式
                    if(this.script[ASTGeneratorStub_dynamic]){
                        //获取新局部域数据
                        const obj=JSGeneratorStub_createLocalDomainUniqueName(this);
                        const scopeName=obj.scopeName;
                        const pd=obj.pd;
                        //没有创建过局部域，就先声明一次
                        if(pd)this.source+=`const ${scopeName}=Object.create(${JSGeneratorStub_getLocalDomainFirstprototype(this,2,2)});\n`;
                        //一大堆处理。简单的说就是用匿名函数立刻执行，然后用(+(num)||0)强制将参数转为数字，相加
                        this.source+=`(function(variable){const obj=${JSGeneratorStub_functionName}(${scopeName},variable);obj[variable]=(+obj[variable]||0)+(+${value}||0);})(${variable})\n;`;
                    }
                    //静态模式
                    else{
                        // console.log(deepCopy([this,this.frames]));
                        
                        const encode_variable=JSGeneratorStub_encode(variable);
                        const obj=JSGeneratorStub_CheckIfItExists(encode_variable,this);
                        const pd=obj.pd;
                        const scopeName=obj.scopeName;
                        const variableName=`${scopeName}_${encode_variable}`;
                        // this.source+=`console.log("断点");\n`;
                        if(!pd)this.source+="let ";
                        this.source+=variableName+"=";
                        if(pd)this.source+=`(+${variableName}||0)+`;
                        this.source+=`(+${value}||0)\n`;
                        //与设置基本一样。特殊处理let就行。
                    }
                    return;
                }
                //for循环
                if(node.kind===`${ExtensionsName}.range`){
                
                    //获取num和variable的js表达式
                    const num=this.descendInput(node.num).asUnknown();
                    const variable=this.descendInput(node.variable).asUnknown();

                    //动态模式
                    if(this.script[ASTGeneratorStub_dynamic]){
                        //这里直接创建两个局部域在 自己 身上
                        const obj1=JSGeneratorStub_createLocalDomainUniqueName(this,true,1);
                        const obj2=JSGeneratorStub_createLocalDomainUniqueName(this,true,1);
                        //不用想，肯定最底下的局部域一定要找一个父作用域，第二个只需要连接第一个即可
                        //而且将最底下的作用域直接设置一个值去使用for的语法就行了
                        const scopeName1=obj1.scopeName;
                        const scopeName2=obj2.scopeName;
                        // this.source+=`console.log("断点");\n`;
                        this.source+=`const ${scopeName1}=Object.create(${JSGeneratorStub_getLocalDomainFirstprototype(this,2,1)});\n`;
                        this.source+=`const ${scopeName2}=Object.create(${scopeName1});\n`;
                        this.source+=`const ${scopeName1}_variable=${variable};\n`;
                        this.source+=`for(let i=1,I=${num};i<=I;++i){\n`;
                        this.source+=`${scopeName1}[${scopeName1}_variable]=i;\n`;
                        this.descendStack(node.substack,{
                            isLoop:true,
                            isLastBlock:false,
                        });
                        //v0.4.7 : bug修复
                        //差点忘了Scratch循环积木隐式帧让步规则。
                        //统一一下行为。
                        this.source+="yield;\n}\n";
                    }
                    //静态模式
                    else{
                        // console.log(deepCopy([this,this.frames]));
                        //同样的，直接创建两个局部域对象
                        //pd其实可以不用管了，毕竟绝对是新建的
                        const encode_variable=JSGeneratorStub_encode(variable);
                        //第一个作用域关心当前的变量名，固不能忽略name且不能乱填name
                        const obj1=JSGeneratorStub_CreateVariable(encode_variable,this,true,1,false);
                        const obj2=JSGeneratorStub_CreateVariable(null,this,true,1,true);
                        const scopeName1=obj1.scopeName;
                        const scopeName2=obj2.scopeName;//其实不用提取。因为第二个就是纯独立于第一个作用域而创建的。
                        const variableName=`${scopeName1}_${encode_variable}`;
                        // this.source+=`console.log("断点");\n`;
                        //根据定义，不可由变量自己影响循环的次数
                        this.source+=`for(let i=1,I=${num};i<=I;++i){\n`;
                        this.source+=`let ${variableName}=i;\n`;
                        this.descendStack(node.substack,{
                            isLoop:true,
                            isLastBlock:false,
                        });
                        //v0.4.7 : bug修复
                        //差点忘了Scratch循环积木隐式帧让步规则。
                        //统一一下行为。
                        this.source+="yield;\n}\n";
                    }
                    return;
                }
                //调试积木
                if(node.kind===`${ExtensionsName}.compilerdebug`){
                    this.source+='console.log("断点");\n';
                    return;
                }
                return originalDescendStackedBlockJS.call(this,node);
            };

            const originalDescendInputJS=JSGeneratorStub.prototype.descendInput;
            JSGeneratorStub.prototype.descendInput=function(node){

                //获取局部变量
                if(node.kind===`${ExtensionsName}.getVariable`){
                    //获取variable的js表达式
                    const variable=this.descendInput(node.variable).asUnknown();
                    //动态模式
                    if(this.script[ASTGeneratorStub_dynamic]){
                        //获取现有的可以用的存放对象，如果没有就用null冒充
                        const scopeName=JSGeneratorStub_getLocalDomainFirstprototype(this,2,1);
                        //获取逻辑
                        //如果name为null，即不存在存放对象，直接返回空字符串
                        if(scopeName==="null")return new TypedInput(`""`,TYPE_UNKNOWN);
                        //因为js原生就是上浮查找访问，所以不用加一个函数
                        return new TypedInput(`(${scopeName}[${variable}]??"")`,TYPE_UNKNOWN);
                    }
                    //静态模式
                    else{
                        // console.log(deepCopy([this,this.frames]));
                        
                        const encode_variable=JSGeneratorStub_encode(variable);
                        const obj=JSGeneratorStub_CheckIfItExists(encode_variable,this,true);
                        const pd=obj.pd;
                        const scopeName=obj.scopeName;
                        if(pd)return new TypedInput(`${scopeName}_${encode_variable}`,TYPE_UNKNOWN);
                        else return new TypedInput(`""`,TYPE_UNKNOWN);
                    }
                }
                return originalDescendInputJS.call(this,node);
            }
        }
        localDomain(args,util){
            //直接进入分支
            util.startBranch(1,false);
        }
        declareVariable(args,util){
            const variable=toString(args.variable);
            const value=args.value;//不强制转换类型，由用户自己决定

            //声明全新的局部域
            createLocalVariableObj(util.thread)[variable]=value;
        }
        editVariable(args,util){
            const variable=toString(args.variable);
            const value=args.value;//不强制转换类型，由用户自己决定

            //尝试获取局部变量处在的局部域，如果没有就新建局部域
            getLocalVariableObj(variable,util.thread)[variable]=value;
        }
        addVariable(args,util){
            const variable=toString(args.variable);
            const value=toNumber(args.value);//强制转换类型为数字

            //尝试获取局部变量处在的局部域，如果没有就新建局部域
            const obj=getLocalVariableObj(variable,util.thread);
            
            //强制转换类型为数字
            obj[variable]=toNumber(obj[variable])+value;
        }
        getVariable(args,util){
            const variable=toString(args.variable); 

            //尝试获取局部变量处在的局部域
            const obj=getLocalVariableObj(variable,util.thread);
            return variable in obj?obj[variable]:"";
        }
        range(args,util){
            let obj=util.stackFrame[localVariable_loopInit];
            // util.stackFrame 返回的时当前栈帧的直接上下文
            if(!obj){
                const num=toNumber(args.num);
                const variable=toString(args.variable);
                //创建两个作用域，第一个用来存放循环的变量，第二个占位
                const LoopLocalVariableObj=createLocalVariableObj(util.thread,true,1);
                createLocalVariableObj(util.thread,true,1);
                obj=util.stackFrame[localVariable_loopInit]={
                    END:num,
                    cur:1,
                    variable:variable,
                    LoopLocalVariableObj:LoopLocalVariableObj
                }
                LoopLocalVariableObj[variable]=obj.cur;
            }
            else obj.LoopLocalVariableObj[obj.variable]=++obj.cur;
            if(obj.cur<=obj.END)util.startBranch(1,true);
        }
        debugLog(args,util){
            const str=toString(args.str);
            console.log(str);

            const stackFrames=[];
            for(const it of getStackFrames(util.thread))stackFrames.push({...it});
            console.log(stackFrames);
        }
        compilerdebug(args,util){

        }
    }
    Scratch.extensions.register(new LocalVariableExtensions());
})(Scratch);