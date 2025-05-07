import './App.css'
import { ThemeProvider } from '@lobehub/ui';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from './layouts/main-layout';
import { Suspense } from 'react';
import App from './page/app/page';
import AppDetail from './page/app-detail/page';
import Chat from './page/chat/page';
import Mcp from './page/mcp/page';
import McpDetail from './page/mcp-detail/page';
import { config } from './config';
import { message } from 'antd';

const router = createBrowserRouter([{
  element: <MainLayout />,
  children: [
    {
      path: '/', element: <Suspense fallback={'加载中'}>
        <App />
      </Suspense>
    },
    {
      path: '/app', element: <Suspense fallback={'加载中'}>
        <App />
      </Suspense>
    },
    {
      path: '/app/:id', element: <Suspense fallback={'加载中'}>
        <AppDetail />
      </Suspense>
    },
    {
      path: '/chat', element: <Suspense fallback={'加载中'}>
        <Chat />
      </Suspense>
    },
    {
      path: '/mcp', element: <Suspense fallback={'加载中'}>
        <Mcp />
      </Suspense>
    },
    {
      path: '/mcp/:id', element: <Suspense fallback={'加载中'}>
        <McpDetail />
      </Suspense>
    }
  ]
}]);




// 保存原始的 fetch 函数
const originalFetch = window.fetch;
// 重写 window.fetch
window.fetch = async (url: any, options: any) => {
  const token = "123456";//localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  // 添加或更新 Authorization 头
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  // 创建新的 options 对象，避免修改原始 options 对象
  const newOptions = { ...options, headers: headers };

  try {
    const baseUrl = config.FAST_API_URL;
    url = `${baseUrl}${url}`.replace(/([^:]\/)\/+/g, '$1');
    const response = await originalFetch(url, newOptions);

    if (response.status >= 200 && response.status < 300) {
      return response;
    }
    if (response.status === 401) {
      window.location.href = '/login';
    }
    if (response.status === 400) {
      const data = await response.json();
      message.error(data.message);
      throw new Error(data);
    } else if (response.status === 404) {
      message.error('请求的资源不存在');
      const data = await response.json();
      message.error(data.message);
      throw new Error(data);
    } else if (response.status === 500) {
      message.error('服务器错误');
      const data = await response.json();
      message.error(data.message);
      throw new Error(data);
    }
    const error = new Error();
    throw error;
  } catch (error) {
    console.error('Fetch error', error);
    throw error;
  }
};


export async function* fetchStream(url: string, requestBody: any, apiKey: string) {
  const token = "123456";//localStorage.getItem('token');
  const headers = {
    Authorization: `Bearer ${token}`,
    "api-key": apiKey,
    'Content-Type': 'application/json',
  };

  // 拼接baseUrl并且处理/重复问题
  const baseUrl = config.FAST_API_URL;
  url = `${baseUrl}${url}`.replace(/([^:]\/)\/+/g, '$1');
  const response = await originalFetch(url, {
    headers,
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  if (!response.body) {
    throw new Error('Response body is null');
  }


  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let done = false;
  let buffer = ''; // 用于存储未完成的 JSON 数据

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;

    if (value) {
      buffer += decoder.decode(value, { stream: true }); // 拼接 chunk 到 buffer

      yield fixIncompleteJson(buffer);
    }
  }
}

/**
 * 修复不完整的 JSON 数据
 */
function fixIncompleteJson(jsonString: string): string {
  try {
    // 尝试直接解析，如果成功则返回原始字符串
    JSON.parse(jsonString);
    return jsonString;
  } catch (error) {
    console.warn('JSON parse error, attempting to fix:', error);

    // 找到最后一个完整的对象的结束位置
    const lastValidIndex = jsonString.lastIndexOf('}');
    if (lastValidIndex === -1) {
      throw new Error('No valid JSON object found in the string');
    }

    // 截取到最后一个完整的对象，并追加一个闭合的数组括号
    const fixedJson = jsonString.slice(0, lastValidIndex + 1) + ']';
    return fixedJson;
  }
}

function AppPage() {
  return (
    <ThemeProvider defaultThemeMode='dark'>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}



export default AppPage

