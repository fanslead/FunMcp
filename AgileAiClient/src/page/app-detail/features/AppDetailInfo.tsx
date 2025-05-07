import { memo, useEffect, useState } from "react";
import styled from "styled-components";
import { Button, message } from 'antd';
import { ApplicationService, ApplicationUpdateDto } from "../../../services/service-proxies";
import { useNavigate } from "react-router-dom";


interface IAppDetailInfoProps {
    value: any
}

const Container = styled.div`
    display: grid;
    padding: 20px; 
    /* 屏幕居中显示 */
    margin: auto;
    width: 580px;
    overflow: auto;
    height: 100%;

    // 隐藏滚动条
    &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;

`;
const ListItem = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 20px;
    width: 100%;
`;

const AppDetailInfo = memo(({ value }: IAppDetailInfoProps) => {


    const navigate = useNavigate();

    if (value === undefined) return null;
    const [application, setApplication] = useState(value);
    var applicationService = new ApplicationService();
   
    useEffect(() => {
        setApplication(value);
    }, [value]);

    function save() {

        let data = new ApplicationUpdateDto({
            name: application.name,
            description: application.description,
            apiKey: application.apiKey,
            id: application.id,
        });

        applicationService.applicationPUT(application.id, data).then(() => {
            message.success('保存成功');
            navigate(`/app`)
        });

    }


    return (
        <>
            <Container>
                <ListItem>
                    <span style={{
                        fontSize: 20,
                        marginRight: 20
                    }}>应用名称</span>
                    <input value={application?.name ?? ""}
                        onChange={(e: any) => {
                            setApplication({
                                ...application,
                                name: e.target.value
                            });
                        }}
                        style={{ width: 380 }}>
                    </input>
                </ListItem>

                <ListItem>
                    <span style={{
                        fontSize: 20,
                        marginRight: 20
                    }}>应用描述</span>
                    <textarea value={application?.description ?? ""}
                        onChange={(e: any) => {
                            setApplication({
                                ...application,
                                description: e.target.value
                            });
                        }}
                        style={{ width: 380, resize: "none", height: '200px' }}>

                    </textarea>
                </ListItem>

                <ListItem>
                    <span style={{
                        fontSize: 20,
                        marginRight: 20
                    }}>应用密钥</span>
                    <input disabled={true}
                    value={application?.apiKey ?? ""}
                        onChange={(e: any) => {
                            setApplication({
                                ...application,
                                apiKey: e.target.value
                            });
                        }}
                        style={{ width: 380 }}>

                    </input>
                </ListItem>

                <Button block onClick={save}  style={{
                    marginTop: 20
                }}>
                    保存修改
                </Button>
            </Container>
        </>
    )

});

export default AppDetailInfo;