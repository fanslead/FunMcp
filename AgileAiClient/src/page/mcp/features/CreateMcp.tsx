import { Input, Modal, TextArea } from '@lobehub/ui';
import { Button, Form, FormInstance, InputNumber, message, Select, Switch } from 'antd';
import { useRef, useState } from "react";
import { McpServerCreateDto, McpServerService } from '../../../services/service-proxies';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';


interface ICreateMcpProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateMcp(props: ICreateMcpProps) {

    const formRef = useRef<FormInstance>(null);

    const transportTypeOptions = [
        { label: 'Stdio', value: 'Stdio' },
        { label: 'Sse', value: 'Sse' },
    ];

    const [transportType, setTransportType] = useState<string>('Stdio'); // 默认值为 Stdio


    var mcpServerService = new McpServerService();

    async function onFinish(values: McpServerCreateDto) {
        try {

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
   
            await mcpServerService.mcpServerPOST(values);
            message.success('创建成功');
            props.onSuccess();
            if (formRef.current) {
                formRef.current.resetFields();
            }
        } catch (e) {
            message.error('创建失败');
        }
    }

    function onFinishFailed(errorInfo: any) {
        console.log('Failed:', errorInfo);
    }

    return (
        <Modal
            title="创建MCP服务"
            open={props.visible}
            onCancel={props.onClose}
            width={600}
            footer={null}
        >
            <Form
                ref={formRef}
                name="basic"
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
                labelCol={{ span: 6 }} // 控制 label 的宽度
                wrapperCol={{ span: 18 }} // 控制输入框的宽度
                initialValues={{ transportType: 'Stdio' }}
            >
                <Form.Item<McpServerCreateDto>
                    label="MCP名称"
                    name="name"
                    rules={[{ required: true, message: '请输入MCP名称' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item<McpServerCreateDto>
                    label="传输类型"
                    name="transportType"
                    rules={[{ required: true, message: '请选择传输类型' }]}
                >
                    <Select options={transportTypeOptions} />
                </Form.Item>

                {transportType === 'Stdio' && (

<>

                <Form.Item<McpServerCreateDto>
                    label="命令"
                    name="command"
                >
                    <Input />
                </Form.Item>

                {/* Arguments (数组) */}
                <Form.List name="arguments">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Form.Item
                                    key={key}
                                    label={name === 0 ? "参数" : ""}
                                    required={false}
                                    wrapperCol={{ offset: name === 0 ? 0 : 6, span: 18 }}
                                >
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Form.Item
                                            {...restField}
                                            name={name}
                                            noStyle
                                            rules={[{ required: true, message: '请输入参数' }]}
                                        >
                                            <Input placeholder="请输入参数" style={{ width: '90%' }} />
                                        </Form.Item>
                                        <MinusCircleOutlined
                                            onClick={() => remove(name)}
                                            style={{ marginLeft: 8, color: 'red', cursor: 'pointer' }}
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
                                    添加参数
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                {/* Environment Variables (字典) */}
                <Form.List name="environmentVariables">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Form.Item
                                    key={key}
                                    label={name === 0 ? "环境变量" : ""}
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
                                            style={{ marginLeft: 8, color: 'red', cursor: 'pointer' }}
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
                                    添加环境变量
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                </>
                )}


{transportType === 'Sse' && (
                    <>
                <Form.Item<McpServerCreateDto>
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

                <Form.Item<McpServerCreateDto>
                    label="连接超时 (毫秒)"
                    name="connectionTimeout"
                >
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                </>
                )}



                {/* <Form.Item<McpServerCreateDto>
                    label="启用"
                    name="enable"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item> */}

                <Form.Item<McpServerCreateDto>
                    label="描述"
                    name="description"
                >
                    <TextArea rows={4} />
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