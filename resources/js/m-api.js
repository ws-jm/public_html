const modelView=document.querySelector(".modelView");
			const modelViewImg=document.querySelector(".model-content img");
			const nav=document.querySelector("nav");
			const cross=document.querySelector(".cross");
			const blackbackground=document.querySelector(".blackbackground");
			const tooltip_att=["data-bs-toggle", "data-bs-placement","data-bs-html", "title"]
			const tooltip_att_values=["tooltip","right","true","Double click to view the image"]

			cross.addEventListener("click", () => {
				modelView.classList.remove("modalVisible");
				modelView.style.display = "none";
				cross.style.display = "none";
			})


			const allImages = document.querySelectorAll(".main-content .modal-view")
			for(let i=0;i<allImages.length;i++){
				for(let j=0;j<tooltip_att.length;j++){
				allImages[i].setAttribute(tooltip_att[j],tooltip_att_values[j])
				}
			}

			for (let yy = 0; yy < allImages.length; yy++) {
				allImages[yy].addEventListener("dblclick", () => {
					let ImageSource = allImages[yy]
					modelView.classList.add("modalVisible");
					modelView.style.display = "block";
					modelViewImg.src = `${ImageSource.getAttribute('src')}`
					cross.style.display = "flex";
				})
			}