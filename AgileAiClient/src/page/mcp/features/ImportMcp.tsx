import { Input, Modal, TextArea } from '@lobehub/ui';
import { Button, Form, FormInstance, InputNumber, message, Select, Switch } from 'antd';
import { useRef, useState } from "react";
import { ImportMcpServerDto, McpServerCreateDto, McpServerService } from '../../../services/service-proxies';

interface ICreateMcpProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ImportMcp(props: ICreateMcpProps) {

    const formRef = useRef<FormInstance>(null);


    var mcpServerService = new McpServerService();

    async function onFinish(values: any) {
        try {

            var data = new ImportMcpServerDto();
            data.name = values.name;
            data.json = values.json;
            await mcpServerService.import(data);
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
            title="导入MCP服务"
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
            >

<Form.Item<McpServerCreateDto>
                    label="MCP名称"
                    name="name"
                    rules={[{ required: true, message: '请输入MCP名称' }]}
                >
                    <Input />
                </Form.Item>
        
                <Form.Item
                    label="JSON"
                    name="json"
                >
                    <TextArea rows={12} />
                </Form.Item>

                <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
                    <Button block type="primary" htmlType="submit">
                        导入
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    )

}