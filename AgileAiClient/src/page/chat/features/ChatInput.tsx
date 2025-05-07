import { useState } from "react";
import { generateRandomString } from "../../../utils/stringHelper";
import { ActionIcon, ChatInputActionBar, ChatInputArea, ChatSendButton } from "@lobehub/ui";
import { Flexbox } from 'react-layout-kit';
import { Eraser, Languages } from 'lucide-react';
import React from "react";
import { message } from "antd";
import { fetchStream } from "../../../App";
import { ChatMessageDto, ChatRequestDto } from "../../../services/service-proxies";

interface IChatInputProps {
    dialog: any;
    application: any;
    id?: string;
    history: any[];
    setHistory: any;
}

export default function ChatInput({
    dialog,
    application,
    id,
    history,
    setHistory
}: IChatInputProps) {



    const [value, setValue] = useState<string>();
    const [loading, setLoading] = useState(false);
    const ref = React.useRef(null);

    async function sendChat() {
        try {

            // ref获取value
            const data = (ref as any).current?.resizableTextArea.textArea.value ?? value;
            if ((ref as any).current?.resizableTextArea.textArea.value) {
                (ref as any).current.resizableTextArea.textArea.value = '';
            }
            setValue('');

            if (!data || data === '') {
                return;
            }
            if (loading) {
                return;
            }

            if (dialog.id === undefined) {
                message.error('请先选择对话框');
                return;
            }

            setLoading(true);
            const chatlayout = document.getElementById('chat-layout');

            let userChat = {
                content: data,
                createat: new Date().toISOString(),
                extra: {},
                id: generateRandomString(10),
                meta: {
                    avatar: 'https://avatars.githubusercontent.com/u/17870709?v=4',
                    title: "我",
                },
                role: 'user',
            };


            history.push(userChat)

            setHistory([...history]);

            let chat = {
                content: '',
                createat: new Date().toISOString(),
                extra: {} as any,
                id: generateRandomString(10),
                meta: {
                    avatar: '😎',
                    backgroundColor: '#E8DA5A',
                    title: 'Advertiser',
                },
                role: 'assistant',
                mcpMessage: [] as any,
            };

            setHistory([...history, chat]);

            // 滚动到底部
            if (chatlayout) {
                chatlayout.scrollTop = chatlayout.scrollHeight;
            }






            let requestInput = new ChatRequestDto({
                chatMessages: [],
                agentId: dialog.id,
            });

            // 携带上文消息 用于生成对话
            history.slice(-4).forEach(x => {
                requestInput.chatMessages.push(new ChatMessageDto({
                    content: x.content,
                    role: x.role
                }));
            });

            let url = '/api/Chat'


            let stream = await fetchStream(url, requestInput, String(application.apiKey));

            for await (const chunk of stream) {

                let messages = JSON.parse(chunk);


                for (let index = 0; index < messages.length; index++) {
                    const aaaaa = messages[index];
                    // 忽略空行
                    if (aaaaa.contents.length <= 0){
                        continue;
                    }

                    try {
                        // 如果是结束标志，停止接收数据
                        if (aaaaa.finishReason === "stop") {

                            // 统计 MCP 调用次数和内容
                            const mcpCallCount = chat.mcpMessage.length;
                            const mcpCallDetails = chat.mcpMessage.map((msg: any, index : any) => `调用 ${index + 1}:\n${msg}`).join("\n\n");

                            // 将统计信息添加到对话内容
                            chat.content += `MCP 调用统计：
                            总调用次数: ${mcpCallCount}`;

                            if(mcpCallCount > 0) {
                                chat.content += '\n\n详细内容： \n```txt\n'+mcpCallDetails;
                                chat.content += '\n```';
                            }
                            setLoading(false);
                            break;
                        }
                        let content = "";
                        if(aaaaa.contents[0].$type == "text") {
                            content = aaaaa.contents[0].text;

                            chat.content += content;
                        }


                        // if(aaaaa.contents[0].$type == "functionCall") {
                        
                        //     //chat.content += "   正在调用工具  ";
                        // }

                        if(aaaaa.contents[0].$type == "functionResult") {
                    
                            try {
                                // 提取 functionResult 的 content
                                const functionResultContent = aaaaa.contents[0]?.result.content?.[0]?.text ?? "";

                                if (functionResultContent) {
                                    
                                    chat.mcpMessage.push(functionResultContent);
                                }
                            } catch (error) {
                                console.error("Error processing functionResult content:", error);
                            }
                        }

                   
                        // 更新 assistant 的对话内容
                        chat.id = aaaaa.responseId;
                       
                        // 更新历史记录
                        setHistory([...history, chat]);

                        // 滚动到底部
                        if (chatlayout) {
                            chatlayout.scrollTop = chatlayout.scrollHeight;
                        }
                    } catch (error) {
                        console.error('Error parsing stream data:', error);
                    }
                }
  
              
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <Flexbox style={{ flex: 1, position: 'relative', width: '100%', height: "100%" }}>
            <ChatInputArea
                value={value}
                onChange={(e: any) => {
                    setValue(e.target.value);
                }}
                placeholder="请输入您的消息"
                onKeyUpCapture={(e: any) => {
                    if (e.key === 'Enter' && !e.shiftKey && value !== '') {
                        sendChat();
                    }
                }}
                style={{
                    height: '100%',
                }}
                bottomAddons={<ChatSendButton loading={loading} onSend={() => sendChat()}

                />}

                topAddons={
                    <ChatInputActionBar
                        leftAddons={
                            <>
                                <ActionIcon icon={Languages} color={undefined} fill={undefined} fillOpacity={undefined} fillRule={undefined} focusable={undefined} />
                                <ActionIcon onClick={() => {

                                }} icon={Eraser} color={undefined} fill={undefined} fillOpacity={undefined} fillRule={undefined} focusable={undefined} />
                            </>
                        }
                    />
                }
            />
        </Flexbox>
    )
}