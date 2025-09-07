import { Link } from "react-router";

type Menu = {
	label: string;
	path: string;
}

export default function(props: { menus: Menu[] }) {
	const { menus } = props;
	return (
		<nav className="flex flex-col grow">
			<ul>
				{menus.map((menu) => (
					<li key={menu.path}>
						<Link to={menu.path} className="block py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-800">
							{menu.label}
						</Link>
					</li>
				))}
			</ul>
		</nav>
	)
}
