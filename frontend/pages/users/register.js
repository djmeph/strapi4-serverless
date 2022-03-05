import React, { useEffect, useContext } from 'react';

import useRouter from 'next/router';
import RegisterForm from '../../components/RegisterForm';
import { UserContext } from '../../context/user';

function Register() {
  return <RegisterForm />;
}

export default Register;
