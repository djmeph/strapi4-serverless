import { useState, createContext } from 'react';
export const UserContext = createContext(null);
import { linstance } from '../lib/api';

const UserProvider = ({ children }) => {

  const [dummy, setDummy] = useState();

  async function dummyfunction() {
   return "dummy function invoked";
  }

  async function doRegister(values) {
  var ret = ['niente'];
  try {
    const resp = await linstance.post('/api/auth/register', values);
    return ['OK', resp.data.message];
  } catch (error) {
    return ['alert', error.response.data.message];
  }
}

  const useract = {
    dummy: dummy,
    setDummy: setDummy,
    dummyfunction: dummyfunction,
    doRegister: doRegister,
  };

  return (
    <UserContext.Provider value={useract}>{children}</UserContext.Provider>
  );
};

export default UserProvider;
