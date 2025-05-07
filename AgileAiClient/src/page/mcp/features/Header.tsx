import { Button } from 'antd';
import { Header } from '@lobehub/ui';
import { useState } from 'react';
import { CreateMcp } from './CreateMcp';
import { ImportMcp } from './ImportMcp';

interface IAppHeaderProps {
    onSucess: () => void;
}

const buttonStyle = {
    marginLeft: '18px',
};

export default function AppHeader(props:IAppHeaderProps) {
    const [visible, setVisible] = useState(false);
    const [visibleImport, setVisibleImport] = useState(false);


    const onClose = () => {
        setVisible(false);
        setVisibleImport(false);
    };
    return (
        <>
            <Header actions={
                    <>
                        <Button style={buttonStyle} onClick={() => setVisible(true)}>新增</Button>
                        <Button style={buttonStyle} onClick={() => setVisibleImport(true)}>导入</Button>
                    </>

            }  nav={'MCP管理'} />
             <CreateMcp visible={visible} onClose={onClose} onSuccess={(()=>{
                               props.onSucess();
                               onClose();
             })}
             />
            <ImportMcp visible={visibleImport} onClose={onClose} onSuccess={(()=>{
                               props.onSucess();
                               onClose();
             })}
             />
        </>
    )
}