import { Layout } from "@lobehub/ui";
import { memo, useState } from "react";
import Header from "../features/Header";
import { McpList } from "../features/McpList";

export default memo(() => {

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
   
            <McpList setInput={(v)=>{
                    setInput(v);
                }} input={input}/>
            </Layout>
    </div>)
});