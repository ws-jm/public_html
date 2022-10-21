
// left section links tree

const parent_menu=document.querySelectorAll(".parent_menu");
for(let link_count=0;link_count<parent_menu.length;link_count++){
    parent_menu[link_count].previousElementSibling.addEventListener("click",()=>{
        parent_menu[link_count].nextElementSibling.classList.toggle("notVisible")  
        if(parent_menu[link_count].nextElementSibling.classList.contains("notVisible")){
            parent_menu[link_count].nextElementSibling.style.display="none"; 
            parent_menu[link_count].previousElementSibling.classList.remove("fa-chevron-right");
            parent_menu[link_count].previousElementSibling.classList.add("fa-chevron-down");
        }    
        else{
            parent_menu[link_count].nextElementSibling.style.display="block";       
            parent_menu[link_count].previousElementSibling.classList.remove("fa-chevron-down");
            parent_menu[link_count].previousElementSibling.classList.add("fa-chevron-right");
        } 
        
    })
}
