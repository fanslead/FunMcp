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

export function AppList(props: IAppListProps) {

    const navigate = useNavigate();
    const [data, setData] = useState<Application2[]>([]);
    const [total, setTotal] = useState(0);

    var applicationService = new ApplicationService();



    useEffect(() => {
        loadingData();
    }, [props.input])

    async function loadingData() {
        try {
            const data = await applicationService.applicationAll("");
            if (data.length > 0) {
                setData(data);
                setTotal(data.length);
            }
        } catch (error) {
            console.log(error);
            message.error('获取数据失败');
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

               
            </Flexbox>
            <Button
                style={{ 
                    float: 'inline-end',
                    position: 'absolute',
                    right: 16,
                }}
                icon={<DeleteOutlined />}
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
