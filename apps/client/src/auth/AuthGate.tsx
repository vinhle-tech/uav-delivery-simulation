import {useState,type FormEvent,type ReactNode} from 'react';
import {authClient} from './session';
import {useAuth} from './useAuth';
import './auth.css';
export default function AuthGate({children}:{children:ReactNode}){
  const auth=useAuth();
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [show,setShow]=useState(false);
  const [error,setError]=useState('');
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setError('');
    try{await authClient.login(email,password);}
    catch(e){setError(e instanceof Error?e.message:'Không thể kết nối Backend.');}
    finally{setPassword('');setShow(false);}
  }
  if(auth.session)return <>{children}</>;
  return <main className="auth-page"><section className="auth-card" aria-labelledby="auth-title">
    <div className="auth-mark" aria-hidden="true">✈</div><p className="auth-kicker">UAV DELIVERY · SIMULATION SYSTEM</p>
    <h1 id="auth-title">Đăng nhập điều phối</h1><p>Truy cập hệ thống giám sát và điều khiển UAV mô phỏng.</p>
    <form onSubmit={submit}>
      <label htmlFor="auth-email">Email</label><input id="auth-email" type="email" autoComplete="username" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} required disabled={auth.busy}/>
      <label htmlFor="auth-password">Mật khẩu</label><div className="auth-password"><input id="auth-password" type={show?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required disabled={auth.busy}/><button type="button" onClick={()=>setShow(!show)} aria-pressed={show}>{show?'Ẩn':'Hiện'}</button></div>
      {(error||auth.notice)&&<p className="auth-notice" role="status">{error||auth.notice}</p>}
      <button className="auth-submit" disabled={auth.busy} type="submit">{auth.busy?'Đang xác thực…':'Đăng nhập'}</button>
    </form><small>Môi trường thực hành · ADMIN / OPERATOR</small>
  </section></main>;
}
export function AccountBar(){
  const {session,busy,notice}=useAuth();
  if(!session)return null;
  return <div className="auth-account"><div><strong>{session.user.fullName}</strong><small>{session.user.role}</small></div><button type="button" disabled={busy} onClick={()=>{void authClient.logout().catch(()=>{});}}>{busy?'Đang xử lý…':'Đăng xuất'}</button>{notice&&<p role="alert">{notice}</p>}</div>;
}
