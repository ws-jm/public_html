

// ****syncing the accordion checkboxes with form interested option checkboxes****

const dropdown_menu_list=document.querySelectorAll(".dropdown-menu li")
const form_checkboxes=document.querySelectorAll(".dropdown-menu li input")
const accordion_checkboxes=document.querySelectorAll(".accordion input")
const accordion_collapse =document.querySelectorAll(".accordion-collapse")

for(let getlist=0;getlist<dropdown_menu_list.length;getlist++){
    dropdown_menu_list[getlist].addEventListener("click",()=>{
       
        setTimeout(()=>{
            if(form_checkboxes[getlist].checked){
                
                accordion_checkboxes[getlist].checked=true
        }
        else{
            accordion_checkboxes[getlist].checked=false
        }
        },100)
        
    })
   }



   for(let getlist=0;getlist<accordion_checkboxes.length;getlist++){
    accordion_checkboxes[getlist].addEventListener("click",()=>{
        
        setTimeout(()=>{
            if(accordion_checkboxes[getlist].checked){
                
                form_checkboxes[getlist].checked=true
        }
        else{
            form_checkboxes[getlist].checked=false
        }
        },100)
        
    })
   }       



//    ****accordian header background****

let accordian_btn=document.querySelectorAll(".accordion-button");
let accordian_header=document.querySelectorAll(".accordion-header ");

accordian_header[0].classList.add("accordion-header-bg");
for(let btn_no=0;btn_no<accordian_btn.length;btn_no++){
    accordian_btn[btn_no].addEventListener("click",()=>{
        
        setTimeout(()=>{
            if(accordian_btn[btn_no].classList.contains("collapsed")){
                
                accordian_header[btn_no].classList.remove("accordion-header-bg");
            }
            else{
                accordian_header.forEach((e)=>{
                    e.classList.remove("accordion-header-bg");
                })
                accordian_header[btn_no].classList.add("accordion-header-bg");
               
       
            }
        },100)
        
    })
    
}



// ****Contact Form****

let form=document.querySelector("form");
       let text=document.getElementById("message");
       let textarea_error=document.querySelector(".textarea-error");
       let name=document.querySelector("#name");
       let name_error=document.querySelector(".name-error");
       let CompanyName_error=document.querySelector(".CompanyName-error");
       let CompanyName=document.querySelector("#CompanyName");
       let succes_form=document.querySelector("#form-success");
      let form_checkbox=document.querySelector("#check");
      let check_error=document.querySelector(".check-error");

       CompanyName_error.style.display="none";
       name_error.style.display="none";
       textarea_error.style.display="none";
       check_error.style.display="none";
       
       form.addEventListener("submit",(e)=>{
           e.preventDefault();
           
           if(name.value.length<3 || CompanyName.value.length<3 || text.value.length<10 || !form_checkbox.checked){

                if(name.value.length<3){
                    name_error.style.display="Block";
                }
                else{
                        name_error.style.display="none";
                }


                if(CompanyName.value.length<3){
                        CompanyName_error.style.display="block";
                }
                else{
                        CompanyName_error.style.display="none";
                }

                if(text.value.length<10){
                        textarea_error.style.display="Block";
                }
                else{
                        textarea_error.style.display="none";
                }

                if(!form_checkbox.checked){
                    check_error.style.display="block";
                }
                else{
                    check_error.style.display="none";
                }

            }

            else{
                let name_Value=document.querySelector("#name").value;
                let CompanyName_Value=document.querySelector("#CompanyName").value;
                let email=document.querySelector("#email").value;
                let Message=document.getElementById("message").value;
                let selected_options="";
                

                for(let getlist=0;getlist<dropdown_menu_list.length;getlist++){
                    
                    if(form_checkboxes[getlist].checked){
                        
                        selected_options+=`${dropdown_menu_list[getlist].textContent}//`
                        
                    }
                   }

                   selected_options = selected_options.substr(0, selected_options.length-2);
                    console.log(selected_options); 


                    var data = { 
                        m_name: name_Value,
                        m_companyName: CompanyName_Value,
                        m_email: email,
                        m_InterestedOptions:selected_options,
                        m_comment: Message
                            };
                            
                        var message = "Name\r\n-------------------------\r\n"
                                    + data['m_name']
                                    + "\r\n\r\nCompany\r\n-------------------------\r\n"
                                    + data['m_companyName']
                                    + "\r\n\r\nEmail\r\n-------------------------\r\n"
                                    + data['m_email']
                                    + "\r\n\r\nInterested-Options\r\n-------------------------\r\n"
                                    + data['m_InterestedOptions']
                                    + "\r\n\r\nMessage\r\n-------------------------\r\n"
                                    + data['m_comment'];
                            alert(`${message}`)
                            $.ajax({
                                url: './SendServiceEMail.php',
                                type: 'post',
                                data: {
                                    service_id: "databases",
                                    body: message,
                                    subject: "Let's Talk Data",
                                    body_type: 'text'
                },
                error:function(jqx,text,error)
                {
            	    let e;
                            if(jqx.responseJSON != undefined) e = jqx.responseJSON.error;
                            else e = error;
                                    dialogWindow("Error in sending request: "+e, "error");
                                    alert("error in sending request")
                                },
                                success: function ( res )
                                {
                                    dialogWindow('Thank you. The message has been sent.', "information");
                                    // $('.form-control').val('');
                                    
                                    form.reset();
                                },
                                async: false
                            });


               
            }
           
       })






       



       