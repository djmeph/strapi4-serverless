import React, { useState, useContext } from 'react';
import { useForm, reset } from 'react-hook-form';
import { UserContext } from '../context/user';

const RegisterForm = () => {
  const { doRegister } = useContext(UserContext);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();
  const password = {};
  password.current = watch('password', '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState(['', '']);

  const onSubmit = async (values) => {
    setIsSubmitting(true);

    const ret = await doRegister(values);

    if (ret[0] === 'alert') {
      setAlert(ret);
    } else {
      setAlert(ret);
      reset();
    }
    setIsSubmitting(false);
  };
  return (
    <main className="container">
      <h1>Register</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="row g-3">
        <div className="mb-3">
          <label className="form-label">
            Username
          </label>
          <input
            type="text"
            className="form-control"
            {...register('username', {
              required: 'Please choose a username',
            })}
          />
          {errors.username && <p>{errors.username.message}</p>}

          <label className="form-label">
          Email address
          </label>
          <input
            type="email"
            className="form-control"
            {...register('email', {
              required: 'Email is required',
              pattern:
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            })}
            placeholder="you@email.com"
          />
          {errors.email && <p>{errors.email.message}</p>}

          <label className="form-label">
            Password
          </label>
          <input
            type="password"
            {...register('password', {
              required: 'You must specify a password',
              minLength: { value: 8, message: 'At least 8 character' },
            })}
            className="form-control"
          />
          {errors.password && <p>{errors.password.message}</p>}

          <label className="form-label">
            Password confirmation
          </label>
          <input
            type="password"
            {...register('repeatpassword', {
              validate: (value) =>
                value === password.current || 'The passwords do not match',
            })}
            className="form-control"
          />
          {errors.repeatpassword && <p>{errors.repeatpassword.message}</p>}
        </div>
        <div className='mb-3'>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting && 'Registering...'}
            {!isSubmitting && 'Register'}
          </button>
        </div>
        {alert[1]}
      </form>
    </main>
  );
}

export default RegisterForm;
