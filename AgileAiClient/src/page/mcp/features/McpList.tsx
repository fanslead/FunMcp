import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { message, Button, Pagination, Switch } from 'antd';
import { GridShowcase, SpotlightCard } from "@lobehub/ui";
import { Flexbox } from 'react-layout-kit';
import { DeleteOutlined } from '@ant-design/icons';
import { McpServerService } from "../../../services/service-proxies";

const McpItemDetail = styled.div`
    
`;

interface IMcpListProps {
    input: {
        page: number;
        pageSize: number;
    }
    setInput: (input: any) => void;
}

interface McpData {
    id?: string;
    name?: string;
    transportType?: string;
    description?: string;
}

export function McpList(props: IMcpListProps) {

    const navigate = useNavigate();
    const [data, setData] = useState<McpData[]>([]);
    const [total, setTotal] = useState(0);
    const [loadingId, setLoadingId] = useState<string | null>(null); // 当前加载的开关 ID
    var mcpServerService = new McpServerService();


    useEffect(() => {
        loadingData();
    }, [props.input])

    async function loadingData() {
        try {

            let data = await mcpServerService.mcpServerAll("", props.input.page, props.input.pageSize);

            setData(data);
            setTotal(data.length);

        } catch (error) {
            console.log(error);
            message.error('获取数据失败');
        }
    }


    async function handleToggle(id: string, enable: boolean) {
        try {
            setLoadingId(id); // 设置当前加载的开关 ID
            if (enable) {
                await mcpServerService.disable(id);
            } else {
                await mcpServerService.enable(id);
            }
            message.success(`服务已${enable ? '禁用' : '启用'}`);
        } catch (error) {
            console.error(error);
            message.error('操作失败，请重试');
        } finally {
            setLoadingId(null); // 清除加载状态
            loadingData();
        }
    }

    async function handleDelete(id: string) {
        try {
            setLoadingId(id); // 设置当前加载的开关 ID
            await mcpServerService.mcpServerDELETE(id);
            message.success('删除成功');
            loadingData(); // 重新加载数据
        } catch (error) {
            console.error(error);
            message.error('删除失败，请重试');
        } finally {
            setLoadingId(null); // 清除加载状态
        }
    }


    const render = (item: any) => (
        <div
            onClick={() => openAppDetail(item.id!)}
            style={{
                display: 'flex',
                flexDirection: 'column',
                padding: 16,
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                marginBottom: 16,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
        >
            {/* 标题和描述 */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{item.name}</div>
                <McpItemDetail style={{ opacity: 0.7 }}>描述:{item.description || '暂无描述'}</McpItemDetail>
            </div>

            {/* 其他字段 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#666', marginBottom: 16 }}>
                <div>
                    <strong>命令参数：</strong>
                    {item.command || '暂无命令'}
                    {item.arguments && item.arguments.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', gap: 8, listStyle: 'none' }}>
                            {item.arguments.map((arg: string, index: number) => (
                                <li key={index} style={{ whiteSpace: 'nowrap' }}>{arg}</li>
                            ))}
                        </ul>
                    ) : (
                        ' 无参数'
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#666', marginBottom: 16 }}>
                <strong>环境变量：</strong>
                {item.environmentVariables && Object.keys(item.environmentVariables).length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {Object.entries(item.environmentVariables).map(([key, env_value]) => (
                            <li key={key}>
                                 <strong>{key}:</strong> {String(env_value)} {/* 将 env_value 转换为字符串 */}
                            </li>
                        ))}
                    </ul>
                ) : (
                    '暂无环境变量'
                )}
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <div onClick={(e) => e.stopPropagation()}> {/* 阻止事件冒泡 */}
                    <Switch
                        loading={loadingId === item.id} // 显示加载状态
                        checked={item.enable}
                        onChange={() => handleToggle(item.id!, item.enable)}
                    />
                </div>                <div onClick={(e) => e.stopPropagation()}> {/* 阻止事件冒泡 */}
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(item.id!)}
                    />
                </div>
            </div>
        </div>
    )



    function openAppDetail(id: string) {
        navigate(`/mcp/${id}`)
    }


    return (<>
        <GridShowcase style={{ width: '100%' }}>
            <img height="135" width="135" src="https://registry.npmmirror.com/@lobehub/assets-logo/1.2.0/files/assets/logo-3d.webp"></img>
            <div style={{ fontSize: 48, fontWeight: 600, marginTop: -16 }}>MCP服务列表</div>
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
