import { login } from "@/services/user"
import { LockOutlined, UserOutlined } from "@ant-design/icons"
import { LoginForm, ProFormText } from "@ant-design/pro-form"
import { message } from "antd"
import { jwtDecode } from "jwt-decode";

interface Props {
  onLogin: (token: string) => void;
}

export default ({ onLogin }: Props) => {
  return (<>
    <LoginForm<{ username: string; password: string }> title={'Offline Login'} onFinish={async data => {
      try {
        const rs = await login(data.username, data.password)
        const loginData = jwtDecode<{
          roles?: string[], realm_access: {
            roles?: string[]
          }
        }>(rs.access_token)

        const roles = [...(loginData.roles || []), ...(loginData.realm_access.roles || [])]

        if (roles.some(it => it == "ROLE_QUEUE_DASHBOARD")) {
          onLogin(rs.access_token)
        } else {
          message.error("No permission.")
        }

      } catch (error) {
        message.error("Failed to longin.")
      }
    }}>
      <ProFormText
        name="username"
        fieldProps={{
          size: 'large',
          prefix: < UserOutlined className={'prefixIcon'} />,
        }}

        rules={[
          {
            required: true,
            message: 'Please enter a username!',
          },
        ]}
      />
      < ProFormText.Password
        name="password"
        fieldProps={{
          size: 'large',
          prefix: < LockOutlined className={'prefixIcon'} />,
        }}

        rules={[
          {
            required: true,
            message: 'Please enter your password! ',
          },
        ]}
      />
    </LoginForm>
  </>)
}