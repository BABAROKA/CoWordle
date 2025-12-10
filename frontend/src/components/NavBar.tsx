const NavBar = () => {
	return (
		<div class="fixed w-full h-10 flex justify-center items-center">
			<p class="text-text font-extrabold text-xl" style={{ "view-transition-name": "title" }}>CoWordle</p>
			<span class="absolute bottom-0 expand-animation bg-dark-gray h-0.5"></span>
		</div>
	)
}

export default NavBar;
