import Image from 'next/image';
import google from '@/assets/google.svg';
import React from 'react';
import { useAuth } from '@/providers/AuthProvider';

const LoginForm = () => {
  const { handleGoogleLogin } = useAuth();

  return (
    <div className="min-h-screen flex items-center pt-[20vh] bg-gray-50 flex-col">
      <h1 className="text-2xl font-bold text-center mb-8">
        Перевірка реєстрації бенефіціарів
      </h1>
      <div
      >
        <button
          onClick={handleGoogleLogin}
          className="
            w-full
            flex items-center justify-center gap-3
            rounded-xl border border-gray-200
            bg-white px-4 py-3
            text-sm font-medium text-gray-800
            shadow-sm
            transition-all
            hover:bg-gray-50 hover:shadow-md
            active:scale-[0.98]
            focus:outline-none focus:ring-2 focus:ring-gray-200
            cursor-pointer
            mb-3
          "
        >
          <Image src={google} alt={'sign in with google'} width={30} height={30}/>
          <span>Продовжити з Google</span>
        </button>
        <p className="text-center text-sm text-gray-600">
          Для входу використовуйте ваш робочий аккаунт
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
