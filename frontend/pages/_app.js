import 'bootstrap/dist/css/bootstrap.min.css';
import UserProvider from '../context/user';

function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <Component {...pageProps} />
    </UserProvider>
  )
}

export default MyApp
