import { memo, useEffect, useState } from "react";
import styled from "styled-components";
import { AutoComplete, Row, Select, Checkbox, Button, Collapse, Col, Slider, message, Input, Form, InputNumber, Switch } from 'antd';
import { TextArea } from "@lobehub/ui";
import { McpServerService, McpServerUpdateDto } from "../../../services/service-proxies";
import { useNavigate } from "react-router-dom";
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';


interface IMcpProps {
    value: any
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    padding: 20px;
    margin: auto;
    max-width: 800px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h3`
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #333;
`;

const StyledForm = styled(Form)`
    .ant-form-item {
        margin-bottom: 16px;
    }

    .ant-form-item-label > label {
        font-weight: 500;
        color: #555;
    }

    .ant-input,
    .ant-select-selector,
    .ant-input-number,
    .ant-switch {
        border-radius: 4px;
    }

    .ant-btn {
        border-radius: 4px;
    }
`;


const McpDetailInfo = memo(({ value }: IMcpProps) => {


    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [mcp, setMcp] = useState(value);
    const mcpServerService = new McpServerService();


    const transportTypeOptions = [
        { label: 'Stdio', value: 'Stdio' },
        { label: 'Sse', value: 'Sse' },
    ];

    const [transportType, setTransportType] = useState<string>('Stdio'); // 默认值为 Stdio



    const handleSave = async (typedValues: unknown) => {
        try {
            const values = typedValues as McpServerUpdateDto; // 类型断言
            if (values.arguments) {
                values.arguments = values.arguments.filter((arg) => arg !== null && arg !== '');
            }

            if (Array.isArray(values.environmentVariables)) {
                values.environmentVariables = values.environmentVariables.reduce((acc, curr) => {
                    if (curr.key && curr.value) {
                        acc[curr.key] = curr.value;
                    }
                    return acc;
                }, {} as Record<string, string>);
            } else {
                values.environmentVariables = undefined; // 或者设置为一个空对象
            }


            if(transportType == 'Stdio') {
                values.additionalHeaders = {};
                values.endpoint = undefined;
                values.connectionTimeout = undefined;
            }
         
       
            if(transportType == 'Sse') {
                values.command = undefined;
                values.arguments = undefined;
                values.environmentVariables = undefined;
            }

            await mcpServerService.mcpServerPUT(mcp.id, values);
            message.success("保存成功");
            navigate(`/app`);
        } catch (error) {
            message.error("保存失败");
        }
    };

    useEffect(() => {
        if (value) {
            if (value.environmentVariables && Object.keys(value.environmentVariables).length === 0) {
                value.environmentVariables = undefined;
            }
            if (value.environmentVariables && typeof value.environmentVariables === 'object') {
                value.environmentVariables = Object.entries(value.environmentVariables).map(([key, value]) => ({
                    key,
                    value,
                }));
            }

            if (value.additionalHeaders && Object.keys(value.additionalHeaders).length === 0) {
                value.additionalHeaders = undefined;
            }
            setMcp(value);
            form.setFieldsValue(value);
        }
    }, [value, form]);

    return (
        <Container>
            <SectionTitle>编辑 MCP 服务</SectionTitle>
            <StyledForm
                form={form}
                name="editMcp"
                onFinish={handleSave}
                layout="vertical"
                initialValues={mcp}
            >
                <Form.Item<McpServerUpdateDto>
                    label="MCP 服务名称"
                    name="name"
                    rules={[{ required: true, message: "请输入 MCP 服务名称" }]}
                >
                    <Input placeholder="请输入 MCP 服务名称" />
                </Form.Item>


                <Form.Item<McpServerUpdateDto>
                    label="传输类型"
                    name="transportType"
                    rules={[{ required: true, message: '请选择传输类型' }]}
                >
                    <Select options={transportTypeOptions} />
                </Form.Item>

                {transportType === 'Stdio' && (

<>

                <Form.Item<McpServerUpdateDto>
                    label="命令"
                    name="command"
                >
                    <Input placeholder="请输入命令" />
                </Form.Item>

                {/* Arguments (数组) */}
                <Form.Item label="参数">
                    <Form.List name="arguments">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                                        <Form.Item
                                            {...restField}
                                            name={name}
                                            noStyle
                                            rules={[{ required: true, message: "请输入参数" }]}
                                        >
                                            <Input placeholder="请输入参数" style={{ width: "90%" }} />
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
                                    添加参数
                                </Button>
                            </>
                        )}
                    </Form.List>
                </Form.Item>

                {/* Environment Variables (字典) */}
                <Form.Item label="环境变量">
                    <Form.List name="environmentVariables">
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
                                            <Input placeholder="键" style={{ width: "45%" }} />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, "value"]}
                                            noStyle
                                            rules={[{ required: true, message: "请输入值" }]}
                                        >
                                            <Input placeholder="值" style={{ width: "45%" }} />
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
                                    添加环境变量
                                </Button>
                            </>
                        )}
                    </Form.List>
                </Form.Item>
                </>
                  )}

{transportType === 'Sse' && (
                    <>

        <Form.Item<McpServerUpdateDto>
                    label="Endpoint"
                    name="endpoint"
                >
                    <Input />
                </Form.Item>

                {/* Additional Headers (字典) */}
                <Form.List name="additionalHeaders">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Form.Item
                                    key={key}
                                    label={name === 0 ? "附加头部" : ""}
                                    required={false}
                                    wrapperCol={{ offset: name === 0 ? 0 : 6, span: 18 }}
                                >
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'key']}
                                            noStyle
                                            rules={[{ required: true, message: '请输入键' }]}
                                        >
                                            <Input placeholder="键" style={{ width: '45%' }} />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'value']}
                                            noStyle
                                            rules={[{ required: true, message: '请输入值' }]}
                                        >
                                            <Input placeholder="值" style={{ width: '45%' }} />
                                        </Form.Item>
                                        <MinusCircleOutlined
                                            onClick={() => remove(name)}
                                            style={{ marginLeft: 8 }}
                                        />
                                    </div>
                                </Form.Item>
                            ))}
                            <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    icon={<PlusOutlined />}
                                    block
                                >
                                    添加附加头部
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>


                <Form.Item<McpServerUpdateDto>
                    label="连接超时 (毫秒)"
                    name="connectionTimeout"
                >
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="请输入连接超时时间" />
                </Form.Item>


</>
)}

<Form.Item<McpServerUpdateDto>
                    label="MCP 服务描述"
                    name="description"
                >
                    <TextArea rows={4} placeholder="请输入 MCP 服务描述" />
                </Form.Item>

                <Form.Item wrapperCol={{ span: 24 }}>
                    <Button block type="primary" htmlType="submit">
                        保存修改
                    </Button>
                </Form.Item>
            </StyledForm>
        </Container>
    );
});
export default McpDetailInfo;