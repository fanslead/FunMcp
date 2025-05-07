import { memo, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppDetailInfo from "../features/AppDetailInfo";
import { Application, ApplicationService } from "../../../services/service-proxies";



export default memo(() => {

    const { id } = useParams<{ id: string }>();
    if (id === undefined) return (<div>id is undefined</div>)

    const [application, setApplication] = useState({} as any);


    var applicationService = new ApplicationService();

    useEffect(() => {
        loadingApplication();
    }, [id]);

    async function loadingApplication() {
       
        let data = await applicationService.applicationGET(id as string);
        setApplication(data);
    }


    return (
        <>
            <div style={{
                width: '100%',
                padding: 20

            }}>
                <AppDetailInfo value={application} />
            </div>
        </>
    )
});