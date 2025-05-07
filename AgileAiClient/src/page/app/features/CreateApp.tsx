import { Input, Modal, TextArea } from '@lobehub/ui';
import { Button, Form, FormInstance, message } from 'antd';
import { useRef } from "react";
import { ApplicationCreateDto, ApplicationService } from '../../../services/service-proxies';

interface ICreateAppProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateApp(props: ICreateAppProps) {

    const formRef = useRef<FormInstance>(null);
    var applicationService = new ApplicationService();
   

    async function onFinish(values: ApplicationCreateDto) {
        try {
            await applicationService.applicationPOST(values);
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
            title="创建应用"
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
                <Form.Item<ApplicationCreateDto>
                    label="应用名称"
                    name="name"
                    rules={[{ required: true, message: '请输入您的应用名称' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item<ApplicationCreateDto>
                    label="应用描述"
                    name="description"
                    rules={[{ message: '请输入您的应用描述' }]}
                >
                    <TextArea  rows={4} />
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