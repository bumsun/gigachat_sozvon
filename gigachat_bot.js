var utils = require('../utils.js');
var configSecret = require("../static/ConfigSecret.js");
const token = configSecret.token_telegram;

var models = require('../models.js');
var UsersModel = models.UsersModel;
var fetch = require("node-fetch");
var querystring = require('querystring');
var socketServer = require('../init_socket.js');

class GigachatBot{
    // async getAccessToken(){

    // }



    firstMessage = "Здравствуйте. Какой предмет вы хотите изучить?"

    //["Тогда приступим к изучению!\nВам известны основы программирования на Python?", "Напиши про основы программирования на Python с примерами."],
    script = [
     ["Вы знаете как работать с переменными на Python?", "Напиши про работу с переменными на языке програмирования Python с примерами.", "Напишите строчку кода на Python, в которой будет присваиваться значение любой переменной.", "Инициализируются ли переменная на языке Python в данном выражении и соответствует ли выражение синтаксису Python? \n Ответь: да или нет."],
     ["Вы знаете как работает функция print()?","Напиши про работу функции print() в языке програмирования Python с примерами.","Напишите код на Python, который выводит в консоль ваше имя","Присутствует ли функция print() в данном выражении и соответствует ли выражение синтаксису Python? \n Ответь: да или нет."],
     ["Вы знаете как работать с условными операторами на Python?","Напиши про работу с условными операторами на языке програмирования Python с примерами.","Напишите код на Python, в котором присутсвует условный оператор","Присутствует ли условный оператор написанный на Python в данном выражении и соответствует ли выражение синтаксису Python? \n Ответь: да или нет."],
     ["Вы знаете как работать с функциями на Python?","Напиши про создание своих функций на языке програмирования Python с примерами.", "Напишите код на Python, в котором объявляется функция","Создается ли функция в данном выражении и соответствует ли выражение синтаксису Python? \n Ответь: да или нет."],
     ["Вы знаете как работать с массивами на Python?","Напиши про работу с массивами на языке програмирования Python с примерами.","Напишите код на Python, в котором инициализируется массив и заполняется значениями", "Присутствует ли массив в данном выражении и соответствует ли выражение синтаксису Python? \n Ответь: да или нет."],
     ["Вы знаете как используются циклы на Python?","Напиши про работу с циклами на языке програмирования Python с примерами.","Напишите код на Python, в котором присутсвует цикл", "Присутствует ли цикл в данном выражении и соответствует ли выражение синтаксису Python? \n Ответь: да или нет."],
     ["Вы знаете как работать со словарями на Python?","Напиши про работу со словарями на языке програмирования Python с примерами.","Напишите код на Python, в котором инициализируется словарь и заполняется значениями", "Присутствует ли словарь в данном выражении и соответствует ли выражение синтаксису Python? \n Ответь: да или нет."]]

    getFirstMessage(){
        return this.firstMessage
    }
 
    async requestToGigachatWithoutContext(message){        
        var form = {
            "system_message": "Ты полезный ассистент программист",
            "human_message": message
        };
        
        var url = "http://77.244.221.121:8080/api/getAnswer";
        const response = await fetch(url,{
            method: 'post',
            body: JSON.stringify(form),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const bodyJson = await response.json();
        console.log("message: "+JSON.stringify(message))
        console.log("bodyJson: "+JSON.stringify(bodyJson))
        return bodyJson.text.content.replaceAll("{python}","") 
    }

    async requestToGigachat(currentUser, message){        
        var form = {
            "system_message": "Ты полезный ассистент",
            "human_message": message,
            "user_id": currentUser._id+""
        };
        
        var url = "http://77.244.221.121:8080/api/getAnswerWithContext";
        const response = await fetch(url,{
            method: 'post',
            body: JSON.stringify(form),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const bodyJson = await response.json();
        console.log("bodyJson: "+JSON.stringify(bodyJson))
        return bodyJson.text.content.replaceAll("{python}","").replaceAll("<code>",'<pre><code class="python">').replaceAll("</code>",'</code></pre>') 
    }

    async createAnswer(message,currentUser){
        socketServer.sendTypingEventCluster("1701381280570", currentUser.vk_caller_id)
        if (message.toLowerCase() == "начать курс"){
            await UsersModel.findOneAndUpdate({'_id': currentUser._id}, {
                "gigachat_state_temp": 0
            }) 
            await UsersModel.findOneAndUpdate({'_id': currentUser._id}, {
                "gigachat_state_temp_level2": 0
            })
            await this.sendMessage(currentUser, this.firstMessage.replace("Здравствуйте","Здравствуйте, "+currentUser.name))
            return
        }
        if (currentUser.gigachat_state_temp == -1){
            await UsersModel.findOneAndUpdate({'_id': currentUser._id}, {
                "gigachat_state_temp": 0
            })
        }
        if(currentUser.gigachat_state_temp == -100){
            var botMessage = await this.requestToGigachat(currentUser, message)
            await this.sendMessage(currentUser, botMessage)
            return
        }

        var gigachat_state_temp_level2 = currentUser.gigachat_state_temp_level2 >= 1 ?  1 : 0;

        if(currentUser.gigachat_state_temp == 0 && currentUser.gigachat_state_temp_level2 == 0){
            if(message.toLowerCase().includes("програм")){
                // this.usersStates[currentUser._id] += 1
                await UsersModel.findOneAndUpdate({'_id': currentUser._id}, {
                    "gigachat_state_temp_level2": 1
                }) 
                message = this.script[currentUser.gigachat_state_temp][gigachat_state_temp_level2]
                await this.sendMessage(currentUser, message)
            }else{
                if(message.toLowerCase().includes("останов")){
                    await UsersModel.findOneAndUpdate({'_id': currentUser._id}, {
                        "gigachat_state_temp": -100
                    }) 
                    await this.sendMessage(currentUser,"Вы вышли из режима курса. Можете задавать любые вопросы")
                    
                }else{
                    message = 'В данный момент есть поддержка предметов:<br/><br/>-Программирование на Python. <br/><br/>Введите название существующего предмета из списка, и мы начнем проходить данный курс.\n Либо введите "Остановись" чтобы выйти из этого режима.'
                    await this.sendMessage(currentUser, message)
                }
                
            }
            return
        }
        console.log("message: "+message)
        if(currentUser.gigachat_state_temp == -1){
            await this.sendMessage(currentUser, this.firstMessage.replace("Здравствуйте","Здравствуйте, "+currentUser.name))
        }else if(currentUser.gigachat_state_temp_level2 == -10){
            await UsersModel.findOneAndUpdate({'_id': currentUser._id}, {
                "gigachat_state_temp_level2": -10
            })

            var promptText = message+" \n "+this.script[currentUser.gigachat_state_temp][3]

            var botMessage = await this.requestToGigachatWithoutContext(promptText)
            
            if(botMessage.toLowerCase().startsWith('да') && !botMessage.toLowerCase().includes('не соответству') && !botMessage.toLowerCase().includes('ошибка')){ 

                var botMessage = await this.requestToGigachat(currentUser, promptText)
                
                
                await UsersModel.findOneAndUpdate({'_id': currentUser._id}, {
                    $inc: {
                        "gigachat_state_temp": 1
                    }
                }) 
                await UsersModel.findOneAndUpdate({'_id': currentUser._id}, {
                    "gigachat_state_temp_level2": 1
                }) 
                if(currentUser.gigachat_state_temp+1 >= this.script.length){
                    await UsersModel.findOneAndUpdate({'_id': currentUser._id}, {
                        "gigachat_state_temp_level2": 0
                    }) 
                    await UsersModel.findOneAndUpdate({'_id': currentUser._id}, {
                        "gigachat_state_temp": -100
                    }) 
                    await this.sendMessage(currentUser, "Поздравляем! Вы прошли весь курс по основам языка программирования Python. Скоро появится много новых курсов.\n\nА пока что вы можете задавать мне любые вопросы.")
                }else{
                    message = this.script[currentUser.gigachat_state_temp+1][0]
                    await this.sendMessage(currentUser, "Поздравляем! Вы справились с заданием. Идём дальше.\n")
                    await this.sendMessage(currentUser, message)
                }
                
            }else{
                await this.sendMessage(currentUser, "К сожалению задание не выполнено корректно, попробуйте еще раз.\n")
            }
            
        } else if(message.toLowerCase().includes("да")){
            // await UsersModel.findOneAndUpdate({'_id': currentUser._id}, {
            //     $inc: {
            //         "gigachat_state_temp": 1
            //     }
            // }) 
            // message = this.script[currentUser.gigachat_state_temp][0]
            await UsersModel.findOneAndUpdate({'_id': currentUser._id}, {
                "gigachat_state_temp_level2": -10
            })

            var message = "Отлично. Тогда сейчас мы проверим ваши знания.\n"+this.script[currentUser.gigachat_state_temp][2]
            await this.sendMessage(currentUser, message)
        }else if(message.toLowerCase().includes("не")){
            await UsersModel.findOneAndUpdate({'_id': currentUser._id}, {
                    $inc: {
                        "gigachat_state_temp_level2": 1
                    }
            })
            var promptText = this.script[currentUser.gigachat_state_temp][gigachat_state_temp_level2]
            if(currentUser.gigachat_state_temp_level2 > 1 && currentUser.gigachat_state_temp_level2 %4 != 1){
                promptText = " Объясни другими словами с примерами."
            }
            var botMessage = await this.requestToGigachat(currentUser, promptText)
            if(currentUser.gigachat_state_temp_level2 > 1 && currentUser.gigachat_state_temp_level2 %4 != 1){
                botMessage = "Попробую объяснить другими словами.<br/>"+botMessage
            }
            await this.sendMessage(currentUser,botMessage+"<br/>Вы усвоили данную тему?")
        }else if(message.toLowerCase().includes("останов")){
            await UsersModel.findOneAndUpdate({'_id': currentUser._id}, {
                "gigachat_state_temp": -100
            }) 
            await this.sendMessage(currentUser,"Изучение программирования остановлено. Можете задавать любые вопросы")
            
        }else{
            console.log("UsersModel: "+UsersModel)
            await this.sendMessage(currentUser, "Можете написать один из вариантов ответа:\n-Да\n-Нет\n-Остановить курс", undefined, undefined);
        }
    }

    async sendMessage(currentUser,message){
        var utils = require('../utils.js');
        await utils.sendMessage("Gu8rGLXEaSuZ16JbLIn71701381280570", currentUser.vk_caller_id, message, undefined, undefined);
    }
    
    async immediatelyPaid(currentUser){
        var form2 = {
            "to_id": currentUser.vk_caller_id,
            "paid_chat": 1
        };
        var formData2 = querystring.stringify(form2);
        var url2 = "https://sozvon.pro/api/setPaidDialog";
        const response2 = await fetch(url2,{
            method: 'post',
            body: formData2,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'access_token': "Gu8rGLXEaSuZ16JbLIn71701381280570"
            }
        });
        const bodyJson2 = await response2.json();
        console.log("bodyJson2: "+bodyJson2)
    }   
}

var gigachatBot = new GigachatBot();

module.exports = gigachatBot;






