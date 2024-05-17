from flask import Flask, render_template, jsonify, send_from_directory,request
import openai
import os
import logging
openai.api_key = "sk-1gBoJvYJ34lfYwz2Be9473C076614b7fA1041fCf0348B10f"
openai.base_url = "https://api.gpt.ge/v1/"
openai.default_headers = {"x-foo": "true"}
app = Flask(__name__)
# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
@app.route('/')
def index():
    return render_template('index.html')

def process_text_with_gpt(text):
    logger.info("Processing text with GPT...")
    client = openai.OpenAI(api_key=openai.api_key, base_url=openai.base_url)

    try:
        logger.info("Sending message to OpenAI API:")
        logger.info({"role": "user", "content": text})
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "用户是一个失语症患者，你要先阅读并且理解这个失语症患者说的话，之后再把他想表达出的意思转述出来即可。你要记住：只需要传达你理解后的意思，不需要再说别的话。另外，你要用用户使用的语言来回复。"},
                {"role": "user", "content": text}
            ],
            model="gpt-4-turbo",
        )
        response_text = chat_completion.choices[0].message.content
        logger.info("Received message from OpenAI API:")
        logger.info({"role": "assistant", "content": response_text})
        return response_text
    except Exception as e:
        logger.error(f"Error while calling OpenAI API: {e}")
        response_text = f"Failed to process text due to an error: {e}"
        return response_text


# 读取文本文件的API
@app.route('/get_text', methods=['GET'])
def get_text():
    try:
        with open('/Users/34800/Desktop/WebUI/WebUI/static/text/speech_text.txt', 'r', encoding='utf-8') as file:
            text = file.read()

        # 调用API处理文本
        processed_text = process_text_with_gpt(text)
        return jsonify({"text": processed_text})
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404

#把语音转文字后的内容存到static的text文件夹下
@app.route('/save_text', methods=['POST'])
def save_text():
    data = request.get_json() 
    text = data['text']
    
    file_path = '/Users/34800/Desktop/WebUI/WebUI/static/text/speech_text.txt'
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(text)  
    
    return jsonify({"message": "Text saved successfully"})

# 在调试模式下运行应用
if __name__ == '__main__':
    app.run(debug=True)

