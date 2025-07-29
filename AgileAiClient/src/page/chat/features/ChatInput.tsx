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

            let mcpMessage = [];
            let usageDetials = {
                inputTokenCount: 0,
                outputTokenCount: 0,
                totalTokenCount: 0
            }
            try {
                let stream = await fetchStream(url, requestInput, String(application.apiKey));


                for await (const chunk of stream) {
                    let message;
                    try {
                        message = JSON.parse(chunk);
                    } catch (jsonError) {
                        console.error('JSON解析错误:', jsonError, '原始数据:', chunk);
                        continue; // 跳过这个块，处理下一个
                    }
                    // 检查当前消息块中是否有结束标志
                    const hasStopMessage = message.finishReason === "stop";
                    if (hasStopMessage) {
                        if (message.contents.length <= 0) {
                            continue;
                        }
                        if (message.contents[0].$type == "functionResult") {
                            try {
                                // 提取 functionResult 的 content
                                const functionResultContent = message.contents[0]?.result.content?.[0]?.text ?? "";
                                if (functionResultContent) {
                                    mcpMessage.push(functionResultContent);
                                }
                            } catch (error) {
                                console.error("Error processing functionResult content:", error);
                            }
                        }
                    }
                    if (message.contents.length <= 0) {
                        continue;
                    }

                    try {
                        if (message.contents[0].$type == "usage") {
                            console.log(message)
                            const details = message.contents[0].details;
                            usageDetials.inputTokenCount += details.inputTokenCount;
                            usageDetials.outputTokenCount += details.outputTokenCount;
                            usageDetials.totalTokenCount += details.totalTokenCount;
                        }
                        if (message.contents[0].$type == "functionResult") {
                            try {
                                // 提取 functionResult 的 content
                                const functionResultContent = message.contents[0]?.result.content?.[0]?.text ?? "";
                                if (functionResultContent) {
                                    mcpMessage.push(functionResultContent);
                                }
                            } catch (error) {
                                console.error("Error processing functionResult content:", error);
                            }
                        }
                        // 如果是结束标志，停止接收数据
                        if (message.finishReason === "stop") {
                            // 统计 MCP 调用次数和内容
                            const mcpCallCount = mcpMessage.length;
                            const mcpCallDetails = mcpMessage.map((msg: any, index: any) => `调用 ${index + 1}:\n${msg}`).join("\n\n");

                            // 将统计信息添加到对话内容
                            chat.content += `\n\nMCP 调用统计：
                        总调用次数: ${mcpCallCount}`;

                            if (mcpCallCount > 0) {
                                chat.content += '\n\n详细内容： \n```txt\n' + mcpCallDetails;
                                chat.content += '\n```';
                            }

                            
                            chat.content += '\n\nTokenx消耗： \n```txt\n输入Token: ' + usageDetials.inputTokenCount + '\n' + '输出Token: '+usageDetials.outputTokenCount +'\n总计Token: ' + usageDetials.totalTokenCount + '\n';
                            chat.content += '\n```';

                            setLoading(false);
                            break;
                        }
                        let content = "";
                        if (message.contents[0].$type == "text") {
                            content = message.contents[0].text;

                            chat.content += content;
                        }

                        // 更新 assistant 的对话内容
                        chat.id = message.responseId;

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
            } catch (error) {
                // 统计 MCP 调用次数和内容
                const mcpCallCount = mcpMessage.length;
                const mcpCallDetails = mcpMessage.map((msg: any, index: any) => `调用 ${index + 1}:\n${msg}`).join("\n\n");

                // 将统计信息添加到对话内容
                chat.content += `MCP 调用统计：
                            总调用次数: ${mcpCallCount}`;

                if (mcpCallCount > 0) {
                    chat.content += '\n\n详细内容： \n```txt\n' + mcpCallDetails;
                    chat.content += '\n```';
                }
                setHistory([...history, chat]);
                setLoading(false);
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