	const leftSide=document.querySelector(".left-side");
	const hamburger=document.querySelector(".hamburger");
	const left_toc=document.querySelectorAll(".left-side ul li a");
	const headings=document.querySelectorAll(".head-padding");
	console.log(headings)

	hamburger.addEventListener("click",()=>{
		leftSide.classList.toggle("showToc");
	})

	hamburger.addEventListener("mousemove",()=>{
		if(leftSide.classList.contains("showToc")){
			hamburger.setAttribute("title",`Close Table of Contents`)
		}
		else{
			hamburger.setAttribute("title",`Table of Contents`)
		}
	})

	for(let i=0;i<left_toc.length;i++){
		left_toc[i].addEventListener("click",(e)=>{
			e.preventDefault()
			leftSide.classList.remove("showToc");
			window.scrollTo({
				top:headings[i].offsetTop-30
			});
		})
	}

	
        const modelView=document.querySelector(".modelView");
		const modelViewImg=document.querySelector(".model-content img");
		const nav=document.querySelector("nav");
		const cross=document.querySelector(".cross");
		const blackbackground=document.querySelector(".blackbackground");
		const tooltip_att=["data-bs-toggle", "data-bs-placement","data-bs-html", "title"]
		const tooltip_att_values=["tooltip","right","true","Double click to view the image"]

		

		cross.addEventListener("click", () => {
			modelView.classList.remove("modalVisible");
			nav.style.display = "block";
			modelView.style.display = "none";
			cross.style.display = "none";
		})


		const allImages = document.querySelectorAll(".main-content img")
		for(let i=0;i<allImages.length;i++){
			for(let j=0;j<tooltip_att.length;j++){
			allImages[i].setAttribute(tooltip_att[j],tooltip_att_values[j])
			}
		}

		for (let yy = 0; yy < allImages.length; yy++) {
			allImages[yy].addEventListener("dblclick", () => {
				let ImageSource = allImages[yy]
				modelView.classList.add("modalVisible");
				nav.style.display = "none";
				modelView.style.display = "block";
				modelViewImg.src = `${ImageSource.getAttribute('src')}`
				cross.style.display = "flex";
			})
		}


	
		

		

