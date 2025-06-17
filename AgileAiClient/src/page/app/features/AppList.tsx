import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { message, Button, Pagination } from 'antd';
import { GridShowcase, SpotlightCard } from "@lobehub/ui";
import { Flexbox } from 'react-layout-kit';
import { DeleteOutlined } from '@ant-design/icons';
import { Application, Application2, ApplicationService } from "../../../services/service-proxies";

const AppItemDetail = styled.div`
    //padding: 16px;
`;

interface IAppListProps {
    input: {
        page: number;
        pageSize: number;
    }
    setInput: (input: any) => void;
}

export function AppList(props: IAppListProps) {    const navigate = useNavigate();
    const [data, setData] = useState<Application2[]>([]);
    const [total, setTotal] = useState(0);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    var applicationService = new ApplicationService();

    useEffect(() => {
        loadingData();
    }, [props.input]);

    async function loadingData() {
        try {
            const data = await applicationService.applicationAll("");
            console.log('获取到的应用数据:', data);
            // Always update the state regardless of data length
            setData(data || []);
            setTotal(data?.length || 0);
        } catch (error) {
            console.log(error);
            message.error('获取数据失败');
        }
    }    async function handleDelete(id: string) {
        try {
            setDeletingId(id); // 设置当前正在删除的ID
            await applicationService.applicationDELETE(id);
            message.success('应用删除成功');
            
            // 直接从本地状态中移除已删除的应用
            setData(prevData => prevData.filter(item => item.id !== id));
            
            // 然后从服务器重新加载最新数据
            setTimeout(() => {
                loadingData();
            }, 300);
        } catch (error) {
            console.error(error);
            message.error('删除失败，请重试');
        } finally {
            setDeletingId(null); // 清除删除状态
        }
    }


    const render = (item: any) => (
        <Flexbox align={'flex-start'} gap={8} horizontal style={{ padding: 16, height: 120, width: '100%' }}>
            <Flexbox onClick={() => {
                openAppDetail(item.id!)
            }} style={{
                width: '100%',
            }}>
                <div style={{ fontSize: 20, fontWeight: 600, width: '100%' }}>
                    {item.name}
                </div>
                <div style={{
                    // 靠底部对齐
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    width: '100%',
                    height: '100%',
                    marginTop: 8,
                }}>
                    <AppItemDetail style={{ opacity: 0.7 }}>
                        描述：
                        {item.description}
                    </AppItemDetail>
                </div>
                <div style={{
                    // 靠底部对齐
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    width: '100%',
                    height: '100%',
                    marginTop: 8,
                }}>
                     <AppItemDetail style={{ opacity: 0.7 }}>
                        密钥：
                        {item.apiKey}
                    </AppItemDetail>
                </div>

               
            </Flexbox>            <Button
                style={{ 
                    float: 'inline-end',
                    position: 'absolute',
                    right: 16,
                }}
                danger
                loading={deletingId === item.id}
                icon={!deletingId || deletingId !== item.id ? <DeleteOutlined /> : null}
                onClick={(e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    handleDelete(item.id!);
                }}
            />
        </Flexbox>
    )


    function openAppDetail(id: string) {
        navigate(`/app/${id}`)
    }


    return (<>
        <GridShowcase style={{ width: '100%' }}>
            <img height="135" width="135" src="https://registry.npmmirror.com/@lobehub/assets-logo/1.2.0/files/assets/logo-3d.webp"></img>
            <div style={{ fontSize: 48, fontWeight: 600, marginTop: -16 }}>应用列表</div>
        </GridShowcase>
        <SpotlightCard style={{
            margin: 16,
            borderRadius: 8,
            boxShadow: '0 0 8px 0 rgba(0,0,0,0.1)',
            overflow: 'auto',
            maxHeight: 'calc(100vh - 100px)',
            padding: 0,
        }} size={data.length} renderItem={render} items={data} >
        </SpotlightCard>
        <Pagination onChange={(page) => {
            props.setInput({
                ...props.input,
                page
            });
        }} total={total} />
    </>)

}
