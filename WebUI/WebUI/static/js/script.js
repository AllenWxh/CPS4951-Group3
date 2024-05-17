let recognition;
let isRecording = false; // 初始状态为未录音
let selectedLanguage = ''; // 保存用户选择的语言

// 定义中英文的发音映射关系
const phoneticMap = {
    'zh-CN': ['zh', 'zh-CN', 'zh-HK', 'zh-TW'],
    'en-US': ['en', 'en-US', 'en-UK', 'en-CA'],
    // 其他语言可以继续添加
};

function toggleRecording() {
    if (!isRecording) {
        // 如果当前没有录音，启动语音识别
        startRecording();
    } else {
        // 如果正在录音，停止语音识别
        stopRecording();
    }
}

function startRecording() {
    const languageSelect = document.getElementById('language-select');
    selectedLanguage = languageSelect.value;

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

    // 设置语言
    if (selectedLanguage) {
        recognition.lang = selectedLanguage;
    } else {
        // 如果用户没有选择语言，则不设置语言属性，保持默认行为
    }

    // 增加词汇量和语言模型
    recognition.continuous = true; // 连续模式，提高词汇量和上下文理解
    recognition.interimResults = true; // 获取中间结果，提高识别准确性
    recognition.maxAlternatives = 5; // 最大备选词数量，提高准确性

    recognition.onstart = function() {//当语音识别开始时触发
        console.log('Voice recognition started. Speak into the microphone.');
        isRecording = true;
    };

    recognition.onresult = function(event) {//当识别到语音并转换成文本时开始触发
        const speechResult = event.results[0][0].transcript;
        const filteredResult = mapToPhonetic(speechResult, selectedLanguage);
        document.querySelector('.text-field').value = filteredResult;
        console.log('Recognized text:', filteredResult);

        // 保存为 txt 文件
        saveAsTxt(filteredResult);
    };

    recognition.onerror = function(event) {//当识别过程中出现错误时触发
        console.error('Speech recognition error', event.error);
    };

    recognition.onend = function() {//停止识别时触发
        isRecording = false;
        console.log('Voice recognition stopped.');
    };

    recognition.start();
}

function stopRecording() {
    if (recognition) {
        recognition.stop();
        isRecording = false;
        console.log('Recording stopped.');
    }
}

// 根据发音映射转换文本
function mapToPhonetic(text, selectedLanguage) {
    const phonetics = phoneticMap[selectedLanguage] || [];
    if (selectedLanguage === 'zh-CN') {
        // 如果选择的是中文，将中文映射成发音相似的英文单词
        text = text.replace(/[\u4E00-\u9FFF]+/g, word => {
            const phoneticWord = word.split('').map(char => {
                const phoneticsArray = phoneticMap['en-US'];
                for (const phonetic of phoneticsArray) {
                    if (phonetic.indexOf(char.toLowerCase()) !== -1) {
                        return phonetic;
                    }
                }
                return char;
            }).join('');
            return phoneticWord;
        });
    } else {
        // 其他语言的处理，与原代码一致
        for (const phonetic of phonetics) {
            text = text.replace(new RegExp(phonetic, 'gi'), selectedLanguage);
        }
    }
    return text;
}

//获取gpt处理的processed_text并显示在textarea中
function translateText() {
    fetch('/get_text')
    .then(response => response.json())
    .then(data => {
        if(data.error) {
            console.error('Error:', data.error);
        } else {
            // 获取处理后的文本并在 <textarea> 中显示
            document.querySelector('.output-field').value = data.text;
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

//post语音转文字的内容到服务器
function saveAsTxt(text) {
    fetch('/save_text', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch((error) => {
        console.error('Error:', error);
    });
}

document.querySelector('.stop-button').addEventListener('click', stopRecording);



