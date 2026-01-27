import type { SVGProps } from 'react';
export const Logo = (props: SVGProps<SVGSVGElement>) => (
    <svg
        {...props}
        width="32"
        height="32"
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M11.332 42.4173H6.83203C5.55293 42.4173 4.58203 41.3963 4.58203 40.1173V25.3373L8.91536 16.5873C9.33203 15.754 10.1654 15.2503 11.082 15.2503H23.082C23.6654 15.2503 24.2487 15.4983 24.6654 15.915L28.832 20.0817"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M45.418 20.418V30.5013C45.418 31.7804 44.397 32.7513 43.168 32.7513H40.2513"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M28.832 20.0817L35.2487 13.665C36.9987 11.915 39.7487 12.8317 39.7487 15.2484V20.415C39.7487 22.415 41.4153 23.9984 43.4153 23.9984H45.4153"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle
            cx="14.418"
            cy="32.7495"
            r="3.58333"
            stroke="hsl(var(--accent))"
            strokeWidth="3"
        />
        <circle
            cx="33.168"
            cy="32.7495"
            r="3.58333"
            stroke="hsl(var(--accent))"
            strokeWidth="3"
        />
    </svg>
);
