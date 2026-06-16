import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  customerToken: string | null;
  isCustomerAuthenticated: boolean;
  loginCustomer: (token: string, customerData: Customer) => void;
  logoutCustomer: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customerToken, setCustomerToken] = useState<string | null>(localStorage.getItem("bairesya_customer_token"));
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (customerToken) {
      fetch("http://localhost:5000/api/public/auth/me", {
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Token inválido");
          return res.json();
        })
        .then((data) => setCustomer(data))
        .catch(() => {
          logoutCustomer();
        });
    }
  }, [customerToken]);

  const loginCustomer = (token: string, customerData: Customer) => {
    localStorage.setItem("bairesya_customer_token", token);
    setCustomerToken(token);
    setCustomer(customerData);
  };

  const logoutCustomer = () => {
    localStorage.removeItem("bairesya_customer_token");
    setCustomerToken(null);
    setCustomer(null);
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        customerToken,
        isCustomerAuthenticated: !!customerToken,
        loginCustomer,
        logoutCustomer,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}
