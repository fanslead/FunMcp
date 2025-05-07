import { Button } from 'antd';
import { Header } from '@lobehub/ui';
import { useState } from 'react';
import { CreateApp } from './CreateApp';

interface IAppHeaderProps {
    onSucess: () => void;
}

const buttonStyle = {
    marginLeft: '18px',
};

export default function AppHeader(props:IAppHeaderProps) {
    const [visible, setVisible] = useState(false);
    const onClose = () => setVisible(false);
    return (
        <>
            <Header actions={<Button style={buttonStyle} onClick={()=>setVisible(true)}>新增</Button>}  nav={'应用管理'} />
            <CreateApp visible={visible} onClose={onClose} onSuccess={(()=>{
                    props.onSucess();
                    onClose();
            })}/>
        </>
    )
}