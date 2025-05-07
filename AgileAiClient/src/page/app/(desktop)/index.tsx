import { Layout } from "@lobehub/ui";
import { memo, useState } from "react";
import Header from "../features/Header";
import { AppList } from "../features/AppList";



const DesktopLayout = memo(() => {

    const [input, setInput] = useState({
        page: 1,
        pageSize: 6
    });


    return (<div>
        <Layout
            footer={[]}
            header={
                <Header onSucess={() => {
                    setInput({
                        ...input,
                        page: 1
                    });
                }} />
            }>
   
            <AppList setInput={(v)=>{
                    setInput(v);
                }} input={input}/>
            </Layout>
    </div>)

});


export default DesktopLayout;