import { Modal, TextArea } from "@lobehub/ui";
import { Form, Input, Button, message, FormInstance, InputNumber, Select, Spin } from 'antd';
import { useEffect, useRef, useState } from "react";
import { Agent, AgentUpdateDto, AgentService, AIConfigDto, AIConfigService, AIModelDto, McpServer2, McpServerService } from "../../../services/service-proxies";
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

interface IEditAgentProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    agentId: string;
}

export function EditDialog(props: IEditAgentProps) {
    const formRef = useRef<FormInstance>(null);
    const [mcpData, setMcpData] = useState<McpServer2[]>([]);
    const [aiConfig, setAiConfig] = useState<AIConfigDto[]>([]);
    const [aiModel, setAiModel] = useState<AIModelDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialValues, setInitialValues] = useState<any>(null);

    const mcpServerService = new McpServerService();
    const agentService = new AgentService();
    const aiConfigService = new AIConfigService();

    // 加载Agent详情数据
    useEffect(() => {
        if (props.visible && props.agentId) {
            loadAgentDetails();
            loadingData();
            loadingAiConfig();
        }
    }, [props.visible, props.agentId]);

    // 加载Agent详情
    async function loadAgentDetails() {
        if (!props.agentId) return;
        
        setLoading(true);
        try {
            const agent = await agentService.agentGET(props.agentId);
            console.log('获取到的Agent数据:', agent);
            
            // 转换 mcpServers 数据格式
            const mcpServerIds = agent.applicationMcpServers?.map(item => item.mcpServerId) || [];
            
            // 转换 mcpServerTools 数据格式
            const mcpServerTools = agent.applicationMcpServers?.reduce((acc, item) => {
                const tools = item.tools || {};
                Object.keys(tools).forEach(key => {
                    acc.push({
                        key: key,
                        value: tools[key].join(',') // 将数组转为逗号分隔的字符串
                    });
                });
                return acc;
            }, [] as { key: string, value: string }[]) || [];

            // 准备表单初始值
            const formValues = {
                name: agent.name,
                description: agent.description,
                systemPrompt: agent.systemPrompt,
                aiServer: agent.aiServer,
                modelId: agent.modelId,
                temperature: agent.temperature,
                maxOutputTokens: agent.maxOutputTokens,
                topP: agent.topP,
                mcpServers: mcpServerIds,
                mcpServerTools: mcpServerTools
            };
            
            setInitialValues(formValues);
            
            // 根据AI服务加载对应的模型列表
            if (agent.aiServer) {
                const selectedConfig = aiConfig.find((config) => config.name === agent.aiServer);
                if (selectedConfig) {
                    setAiModel(selectedConfig.models || []);
                }
            }
            
            // 设置表单值
            if (formRef.current) {
                formRef.current.setFieldsValue(formValues);
            }
            
        } catch (error) {
            console.error('加载Agent详情失败:', error);
            message.error('加载Agent详情失败');
        } finally {
            setLoading(false);
        }
    }

    async function loadingData() {
        try {
            let data = await mcpServerService.mcpServerAll("", 0, 999);
            setMcpData(data);
        } catch (error) {
            console.log(error);
            message.error('获取MCP服务数据失败');
        }
    }

    async function loadingAiConfig() {
        try {
            let data = await aiConfigService.aIConfig();
            setAiConfig(data);
        } catch (error) {
            console.log(error);
            message.error('获取AI配置数据失败');
        }
    }

    async function onFinish(values: any) {
        try {
            setLoading(true);
            
            // 准备更新的数据
            const updateDto = new AgentUpdateDto();
            updateDto.name = values.name;
            updateDto.description = values.description;
            updateDto.systemPrompt = values.systemPrompt;
            updateDto.aiServer = values.aiServer;
            updateDto.modelId = values.modelId;
            updateDto.temperature = values.temperature;
            updateDto.maxOutputTokens = values.maxOutputTokens;
            updateDto.topP = values.topP;
            updateDto.mcpServers = values.mcpServers;
            
            // 转换 mcpServerTools 格式
            if (values.mcpServerTools && values.mcpServerTools.length > 0) {
                const toolsMap: { [key: string]: string[] } = {};
                values.mcpServerTools.forEach((item: { key: string, value: string }) => {
                    if (item.key && item.value) {
                        // 将逗号分隔的字符串转为数组
                        toolsMap[item.key] = item.value.split(',').map(v => v.trim());
                    }
                });
                updateDto.mcpServerTools = toolsMap;
            }
            
            console.log('提交更新数据:', updateDto);
            await agentService.agentPUT(props.agentId, updateDto);
            message.success('更新成功');
            props.onSuccess();
            props.onClose();
        } catch (error) {
            console.error('更新失败:', error);
            message.error('更新失败');
        } finally {
            setLoading(false);
        }
    }

    function onFinishFailed(errorInfo: any) {
        console.log('表单验证失败:', errorInfo);
    }

    return (
        <Modal
            title="编辑Agent"
            open={props.visible}
            onCancel={props.onClose}
            width={600}
            footer={null}
            destroyOnClose={true}
        >
            <Spin spinning={loading}>
                {initialValues && (
                    <Form
                        ref={formRef}
                        name="editAgentForm"
                        initialValues={initialValues}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                        preserve={false}
                    >
                        <Form.Item
                            label="Agent名称"
                            name="name"
                            rules={[{ required: true, message: '请输入Agent名称' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Agent描述"
                            name="description"
                        >
                            <TextArea rows={4} placeholder="请输入Agent描述" />
                        </Form.Item>

                        <Form.Item
                            label="系统提示"
                            name="systemPrompt"
                            rules={[{ required: true, message: '请输入系统提示' }]}
                        >
                            <TextArea rows={4} placeholder="请输入系统提示" />
                        </Form.Item>

                        <Form.Item
                            label="AI 服务"
                            name="aiServer"
                            rules={[{ required: true, message: '请选择 AI 服务' }]}
                        >
                            <Select
                                placeholder="请选择 AI 服务"
                                style={{ width: '100%' }}
                                options={aiConfig.map((item) => ({
                                    label: item.name,
                                    value: item.name,
                                }))}
                                onChange={(value) => {
                                    const selectedConfig = aiConfig.find((config) => config.name === value);
                                    if (selectedConfig) {
                                        setAiModel(selectedConfig.models || []);
                                        // 重置modelId
                                        formRef.current?.setFieldsValue({ modelId: undefined });
                                    }
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            label="模型 ID"
                            name="modelId"
                            rules={[{ required: true, message: '请选择模型 ID' }]}
                        >
                            <Select
                                placeholder="请选择模型"
                                style={{ width: '100%' }}
                                options={aiModel.map((item) => ({
                                    label: item.name,
                                    value: item.modelId,
                                }))}
                            />
                        </Form.Item>

                        <Form.Item
                            label="温度"
                            name="temperature"
                        >
                            <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            label="最大输出 Token"
                            name="maxOutputTokens"
                        >
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            label="Top P"
                            name="topP"
                        >
                            <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            label="MCP 服务"
                            name="mcpServers"
                        >
                            <Select
                                mode="multiple"
                                placeholder="请选择 MCP 服务"
                                style={{ width: '100%' }}
                                options={mcpData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                }))}
                            />
                        </Form.Item>

                        <Form.Item
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
                            <Button block type="primary" htmlType="submit" loading={loading}>
                                更新
                            </Button>
                        </Form.Item>
                    </Form>
                )}
            </Spin>
        </Modal>
    );
}
