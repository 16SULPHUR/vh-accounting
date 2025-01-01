export const menuConfig = [
    {
      label: 'Dashboard',
      href: '/',    
    },
    {
      label: 'Masters',
      submenu: [
        { label: 'Accounts', href: '/masters/accounts' },
        { label: 'Inventory', href: '/masters/inventory' },
      ],
    },
    {
      label: 'Reports',
      submenu: [
        { label: 'Cashbook', href: '/reports/cashbook' },
        { label: 'Bankbook', href: '/reports/bankbook' },
      ],
    },
    {
      label: 'Transactions',
      submenu: [
        {
          label: 'Cashbook',
          submenu: [
            { label: 'Receipt', href: '/transactions/cashbook/receipt' },
            { label: 'Payment', href: '/transactions/cashbook/payment' },
          ],
        },
        {
          label: 'Bankbook',
          submenu: [
            { label: 'Receipt', href: '/transactions/bankbook/receipt' },
            { label: 'Payment', href: '/transactions/bankbook/payment' },
          ],
        },
      ],
    },
  ];
  
  
