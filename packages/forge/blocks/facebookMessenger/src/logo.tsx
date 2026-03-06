export const MessengerLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="100%"
    height="100%"
  >
    <radialGradient
      id="messenger-gradient"
      cx="11.087"
      cy="7.022"
      r="47.612"
      gradientTransform="matrix(1 0 0 -1 0 50)"
      gradientUnits="userSpaceOnUse"
    >
      <stop offset="0" stopColor="#1292ff" />
      <stop offset=".079" stopColor="#2982fe" />
      <stop offset=".23" stopColor="#4e69fc" />
      <stop offset=".351" stopColor="#6559fb" />
      <stop offset=".428" stopColor="#6d53fa" />
      <stop offset=".754" stopColor="#df47aa" />
      <stop offset=".946" stopColor="#ff6257" />
    </radialGradient>
    <path
      fill="url(#messenger-gradient)"
      d="M24 4C12.954 4 4 12.495 4 23c0 5.792 2.56 10.984 6.641 14.571C10.936 37.885 11 38.206 11 38.5v3.977c0 .813.871 1.339 1.586.979L17 41.07c.289-.145.616-.18.926-.094C19.875 41.619 21.897 42 24 42c11.046 0 20-8.495 20-19S35.046 4 24 4z"
    />
    <path
      fill="#fff"
      d="M10.896 28.891l5.896-9.346a3 3 0 014.14-.813l4.69 3.513a1.2 1.2 0 001.44 0l6.332-4.803c.843-.64 1.946.37 1.376 1.27l-5.895 9.346a3 3 0 01-4.14.813l-4.69-3.512a1.2 1.2 0 00-1.44 0L12.272 30.16c-.843.641-1.946-.37-1.376-1.269z"
    />
  </svg>
)
