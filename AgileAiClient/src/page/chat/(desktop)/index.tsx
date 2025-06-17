import { DraggablePanel, Tooltip, } from "@lobehub/ui";
import { Select } from 'antd';
import { useEffect, useState } from "react";
import Divider from "@lobehub/ui/es/Form/components/FormDivider";
import { Button, message } from 'antd'
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { CreateDialog } from "../../chat/features/CreateDialog";
import { EditDialog } from "../../chat/features/EditDialog";
import ChatInput from "../../chat/features/ChatInput";
import { Flexbox } from 'react-layout-kit';
import ChatAppList from "../features/ChatAppList";
import { Agent, AgentService, Application, ApplicationService } from "../../../services/service-proxies";





const DialogList = styled.div`
    margin-top: 8px;
    padding: 8px;
    overflow: auto;
    height: calc(100vh - 110px);
`;

const DialogItem = styled.div`
    padding: 8px;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 8px;
    transition: border-color 0.3s linear;
    &:hover {
        border-color: #1890ff;
    }

    // 当组件被选中时修改样式
    &.selected {
        border-color: #1890ff;
    }
`;

export default function DesktopLayout() {
    const navigate = useNavigate();

    const [applications, setApplications] = useState([] as Application[]);
    const [application, setApplication] = useState({} as Application);


    const [dialogs, setDialogs] = useState([] as Agent[]);    const [dialog, setDialog] = useState({} as Agent);

    const [createDialogVisible, setCreateDialogVisible] = useState(false);
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [currentAgentId, setCurrentAgentId] = useState<string>("");

    const [history, setHistory] = useState([] as any[]);


    const [input] = useState({
        page: 1,
        pageSize: 20
    });

    useEffect(() => {
        loadingApplications();
    }, []);

    useEffect(() => {
        if (application) {
            loadingDialogs();
        }
    }, [application]);

    // useEffect(() => {
    //     if (dialog) {
    //         //LoadingSession();
    //     }
    // }, [dialog, input]);


    var applicationService = new ApplicationService();
    var agentService = new AgentService();

    async function loadingApplications() {
        try {

            const data = await applicationService.applicationAll("");
            if (data.length > 0) {
                setApplications(data);
                setApplication(data[0]);
            }
        } catch (error) {

        }
    }

    async function loadingDialogs() {
        try {
            if (application.id === undefined) {
                return;
            }
            let data = await agentService.agentAll(application.id);

            if (data.length > 0) {
                setDialogs(data);
                setDialog(data[0]);
            }
          
        }

        catch (error) {

        }
    }

    // async function LoadingSession() {
    //     try {
    //         if (dialog.id === undefined) {
    //             return;
    //         }
    //         const mockData:any[] = [];

    //         const history = mockData!.map((item: any) => {
    //             return {
    //                 content: item.content,
    //                 createat: item.createat,
    //                 extra: {
    //                     referenceFile: item.referenceFile,
    //                 },
    //                 id: item.id,
    //                 meta: {
    //                     avatar: item.current ? "https://blog-simple.oss-cn-shenzhen.aliyuncs.com/Avatar.jpg" : "https://blog-simple.oss-cn-shenzhen.aliyuncs.com/chatgpt.png",
    //                     title: item.current ? "我" : "AI助手",
    //                 },
    //                 role: item.current ? 'user' : 'assistant',
    //             };
    //         });

    //         setHistory(history);

    //         setTimeout(() => {
    //             const chatlayout = document.getElementById('chat-layout');
    //             if (chatlayout) {
    //                 chatlayout.scrollTop = chatlayout.scrollHeight;
    //             }
    //         }, 1000);
    //     } catch (error) {

    //     }
    // }




    function handleChange(id: any) {
        const app = applications.find(app => app.id === id);
        if (app) {
            setApplication(app);
        }
    }

    async function deleteDialog(id: string) {
        try {
            agentService.agentDELETE(id).then(() => {
                loadingDialogs();
                message.success('删除成功');
                return;
            });
        } catch (e) {
            message.error('删除失败');
        }
    }

    return <Flexbox style={{ height: '100vh', position: 'relative', width: '100%' }} horizontal>
    
        <DraggablePanel
            mode="fixed"
            placement="left"
            showHandlerWhenUnexpand={true}
            resize={false}
            pin={true}
            minWidth={0}
        >
            <div
                style={{
                    padding: 8,
                }}>

                <div style={{
                    fontSize: 20,
                    fontWeight: 600,
                    marginBottom: 16
                }}>
                    请选择您的应用
                </div>
                <Select
                    title="请选择您的应用"
                    style={{
                        width: '100%',
                    }}
                    onChange={handleChange}
                    defaultValue={application?.id}
                    value={application?.id}
                    options={applications.map((item) => {
                        return { label: item.name, value: item.id }
                    })}
                />
            </div>
            <Divider />
            <DialogList>
                {
                    dialogs?.map((item: any) => {
                        return <DialogItem
                            key={item.id}
                            // 当组件被选中时修改样式
                            className={dialog?.id === item.id ? 'selected' : ''}
                            onClick={() => {
                                setDialog(item);
                            }}>
                            <Tooltip title={item.description}>
                                {item.name}
                            </Tooltip>                            <div style={{ float: 'inline-end' }}>
                                <Button
                                    size='small'
                                    icon={<EditOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation(); // 阻止事件冒泡，避免触发DialogItem的点击事件
                                        setCurrentAgentId(item.id);
                                        setEditDialogVisible(true);
                                    }}
                                    style={{ marginRight: 4 }}
                                />
                                <Button
                                    size='small'
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation(); // 阻止事件冒泡，避免触发DialogItem的点击事件
                                        deleteDialog(item.id)
                                    }}
                                />
                            </div>
                        </DialogItem>
                    })
                }
                <Button onClick={() => setCreateDialogVisible(true)} style={{
                    marginTop: 8
                }} block>新建Agent</Button>

            </DialogList>
        </DraggablePanel>
        <Flexbox style={{ height: '100vh', position: 'relative', width: '100%' }}>
            <div style={{ height: 60 }}>
                <div style={{
                    fontSize: 20,
                    fontWeight: 600,
                    textAlign: 'left',
                    padding: 15
                }}>
                    {dialog.name}
                </div>
            </div>
            <Divider />
            <Flexbox style={{ overflow: 'auto', flex: 1 }}>
                <ChatAppList setHistory={(v: any) => {
                    setHistory([...v]);
                }} history={history} application={application} />
            </Flexbox>
            <DraggablePanel style={{
                height: '100%'
            }} maxHeight={600} minHeight={180} placement='bottom'>
                <ChatInput dialog={dialog} application={application} setHistory={(v: any) => {
                    setHistory(v);
                }
                } history={history} />
            </DraggablePanel>            <CreateDialog visible={createDialogVisible} id={application?.id} onClose={() => {
                setCreateDialogVisible(false);
                loadingDialogs();
            }}
            onSuccess={() => console.log('创建成功')} />
            <EditDialog 
                visible={editDialogVisible} 
                agentId={currentAgentId}
                onClose={() => {
                    setEditDialogVisible(false);
                }}
                onSuccess={() => {
                    loadingDialogs();
                    message.success('Agent更新成功');
                }}
            />
        </Flexbox>
    </Flexbox>
}