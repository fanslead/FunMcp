import { ChatList, ChatListProps,  Tag } from "@lobehub/ui";
import { message } from "antd";
import { Button } from "antd";

import {
    ActionsBar,
} from '@lobehub/ui';
import { ApplicationService } from "../../../services/service-proxies";

interface IChatAppListProps {
    application: any;
    history: any[];
    setHistory: any;
    id?: string;
}

export default function ChatAppList({
    application,
    history,
    setHistory,
    id,
}: IChatAppListProps) {

    async function ActionsClick(e: any, item: any) {
        if (e.key === 'del') {
    
            message.success('删除成功');
            const index = history.findIndex((i) => i.id === item.id);
            history.splice(index, 1);
            setHistory([...history]);

        } else if (e.key === 'regenerate') {
            message.error('暂时并未支持重置!');
        }
    }

    const control: ChatListProps | any =
    {
        showTitle: false,
    }

    return (
        <div id='chat-layout' style={{ overflow: 'auto', flex: 1 }}>
            <ChatList
                data={(history === null || history.length === 0) ? [{
                    content: "欢迎使用AI助手，请开始提问吧",
                    createat: new Date().toISOString(),
                    extra: {},
                    id: 0,
                    meta: {
                        avatar: '😎',
                        backgroundColor: '#E8DA5A',
                        title: "AI助手",
                    },
                    role: 'assistant',
                }] : history}
                renderActions={ActionsBar}
                onActionsClick={ActionsClick}
                onMessageChange={async (e: any, message) => {
                    if (e === 0) {
                        return
                    }
                    if (id) {
                     
                    } else {
                       
                    }
                    history.forEach((item) => {
                        if (item.id === e) {
                            item.content = message;
                        }
                    });
                    setHistory([...history]);
                }}
                renderMessages={{
                    default: ({ id, editableContent }: any) => {
                        if (editableContent.props.value) {
                            const v = history.find((i) => i.id === id);
                            if (v?.extra?.referenceFile) {
                                return (<div id={id}>
                                    {editableContent}
                                    {v.extra.referenceFile.map((item: any) => <Tag onClick={() => {
                                        window.open(item.filePath, '_blank');
                                    }} style={{
                                        marginTop: 8,
                                    }}>{item.name}</Tag>)}
                                </div>)
                            }
                            return (<div id={id}>{editableContent}</div>)
                        }else{
                            return (<Button type='text' loading={true} icon={<></>} />)
                        }

                    },
                }}
                style={{ width: '100%' }}
                {...control}
            />
        </div>
    )
}