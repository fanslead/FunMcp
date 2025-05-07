import { Modal, TextArea } from "@lobehub/ui";
import { Form, Input, Button, message , FormInstance, InputNumber, Select} from 'antd';
import {useEffect, useRef, useState } from "react";
import { AgentCreateDto, AgentService, AIConfigDto, AIConfigService, AIModelDto, McpServer2, McpServerService } from "../../../services/service-proxies";
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';


interface ICreateAppProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    id: string;
    
}

export function CreateDialog(props: ICreateAppProps) {

    const formRef = useRef<FormInstance>(null);
    const [mcpData, setMcpData] = useState<McpServer2[]>([]);
    const [aiConfig, setAiConfig] = useState<AIConfigDto[]>([]);
    const [aiModel, setAiModel] = useState<AIModelDto[]>([]);

    var mcpServerService = new McpServerService();
    var agentService = new AgentService();
    var aiConfigService = new AIConfigService();

    useEffect(() => {
        loadingData();
        LoadingAiConfig();
    }, [props.id])

    async function loadingData() {
        try {
            let data = await mcpServerService.mcpServerAll("", 0, 999);
            setMcpData(data);
        } catch (error) {
            console.log(error);
            message.error('获取数据失败');
        }
    }

    async function LoadingAiConfig() {
        let data = await aiConfigService.aIConfig();
        setAiConfig(data);
    }


    async function onFinish(values: AgentCreateDto) {
        try {
            values.applicationId = props.id;
            console.log('提交数据:', values);
            //values.mcpServers = undefined;
            //values.mcpServerTools = undefined;
            await agentService.agentPOST(values);
            message.success('创建成功');
            props.onSuccess();
            if (formRef.current) {
                formRef.current.resetFields();
            }
            props.onClose();
        } catch (e) {
            message.error('创建失败');
        }
    }

    function onFinishFailed(errorInfo: any) {
        console.log('Failed:', errorInfo);
    }

    return (
        <Modal
        title="创建Agent"
        open={props.visible}
        onCancel={props.onClose}
        width={600}
        footer={null}
    >
        <Form
            ref={formRef}
            name="createDialog"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            labelCol={{ span: 6 }} // 控制 label 的宽度
            wrapperCol={{ span: 18 }} // 控制输入框的宽度
        >
            <Form.Item<AgentCreateDto>
                label="Agent名称"
                name="name"
                rules={[{ required: true, message: '请输入Agent名称' }]}
            >
                <Input />
            </Form.Item>

            <Form.Item<AgentCreateDto>
                label="Agent描述"
                name="description"
            >
                <TextArea rows={4} placeholder="请输入Agent描述" />
            </Form.Item>

            <Form.Item<AgentCreateDto>
                label="系统提示"
                name="systemPrompt"
                rules={[{ required: true, message: '请输入系统提示' }]}
            >
                <TextArea rows={4} placeholder="请输入系统提示" />
            </Form.Item>

            <Form.Item<AgentCreateDto>
                label="AI 服务"
                name="aiServer"
                rules={[{ required: true, message: '请选择 AI 服务' }]}
            >
                <Select
                    placeholder="请输入 AI 服务"
                    style={{ width: '100%' }}
                    options={aiConfig.map((item) => ({
                        label: item.name, // 假设 `McpServer2` 中有 `name` 字段
                        value: item.name,   // 假设 `McpServer2` 中有 `id` 字段
                    }))}
                    onChange={(value) => {
                        const selectedConfig = aiConfig.find((config) => config.name === value);
                        if (selectedConfig) {
                            setAiModel(selectedConfig.models!);
                        }
                    }}
                />

            </Form.Item>

            <Form.Item<AgentCreateDto>
                label="模型 ID"
                name="modelId"
                rules={[{ required: true, message: '请输入模型 ID' }]}
            >
                <Select
                    placeholder="请输入 AI 服务"
                    style={{ width: '100%' }}
                    options={aiModel.map((item) => ({
                        label: item.name, // 假设 `McpServer2` 中有 `name` 字段
                        value: item.modelId,   // 假设 `McpServer2` 中有 `id` 字段
                    }))}
                />
            </Form.Item>

            <Form.Item<AgentCreateDto>
                label="温度"
                name="temperature"
            >
                <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item<AgentCreateDto>
                label="最大输出 Token"
                name="maxOutputTokens"
            >
                <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item<AgentCreateDto>
                label="Top P"
                name="topP"
            >
                <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item<AgentCreateDto>
                label="MCP 服务"
                name="mcpServers"
            >
                <Select
                    mode="tags"
                    placeholder="请输入 MCP 服务"
                    style={{ width: '100%' }}
                    options={mcpData.map((item) => ({
                        label: item.name, // 假设 `McpServer2` 中有 `name` 字段
                        value: item.id,   // 假设 `McpServer2` 中有 `id` 字段
                    }))}
                />
            </Form.Item>

            <Form.Item<AgentCreateDto>
    label="MCP 服务工具"
    name="mcpServerTools"
>
    <Form.List name="mcpServerTools">
        {(fields, { add, remove }) => (
            <>
                {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                        <Form.Item
                            {...restField}
                            name={[name, "key"]}
                            noStyle
                            rules={[{ required: true, message: "请输入键" }]}
                        >
                            <Input placeholder="键" style={{ width: "30%" }} />
                        </Form.Item>
                        <Form.Item
                            {...restField}
                            name={[name, "value"]}
                            noStyle
                            rules={[{ required: true, message: "请输入值（以逗号分隔）" }]}
                        >
                            <Input
                                placeholder="值（多个值用逗号分隔）"
                                style={{ width: "60%" }}
                            />
                        </Form.Item>
                        <MinusCircleOutlined
                            onClick={() => remove(name)}
                            style={{ color: "red", cursor: "pointer" }}
                        />
                    </div>
                ))}
                <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                    block
                >
                    添加工具
                </Button>
            </>
        )}
    </Form.List>
</Form.Item>

            <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
                <Button block type="primary" htmlType="submit">
                    创建
                </Button>
            </Form.Item>
        </Form>
    </Modal>
    )
}