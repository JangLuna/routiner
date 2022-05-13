const baseUrl = 'http://localhost:3000';
let token = localStorage.getItem('HoopsToken');

if (token != undefined && token.length > 0) {
  // 토큰 검증
  axios
    .post(baseUrl + '/auth/verify_token', { token: token })
    .then((response) => {
      let tokenExpired = response.data.expired;

      if (!tokenExpired) {
        // 토큰이 만료되지 않았을 떄( 로그인 상태 )
        $('#nav-button-box').hide();
        mainInit();
      } else {
        // 만료되었을 때 (로그 아웃 상태 )
        localStorage.removeItem('HoopsToken');
        navBarInit();
      }
    });
} else {
  $('.routain-list').empty();

  navBarInit();

  alert('로그인을 진행하여 주십시오.');
}

function mainInit() {
  // 루틴 목록 가져오기
  axios({
    url: baseUrl + '/routain/get_routain_list',
    method: 'get',
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).then((res) => {
    let routainList = res.data.data.routainList;

    // 루틴 리스트 표시할 곳
    const jRoutainList = $('.routain-list').empty();

    if (routainList != undefined) {
      // 루틴 1개씩 돌아가면서 찍음
      for (let i in routainList) {
        let routain = routainList[i];

        let jRoutain = $(
          '<li class="list-group-item routain-list-item">' +
            '<span>Normal Routain</span>' +
            '<i class="bi bi-trash routain-delete" style="font-size: 16px; float: right"></i>' +
            '<i class="bi bi-pencil routain-modify" data-bs-toggle="modal" data-bs-target="#routainModifyModal" style="font-size: 16px; float: right; margin-right: 15px;"></i>' +
            '</li>'
        );

        // add attributes and data mapping
        jRoutain.find('span').text(routain.name);
        jRoutain.attr('id', routain.id);

        // add click event to delete btn and modify btn
        jRoutain.find('.routain-delete').on('click', function () {
          let id = $(this).parent().attr('id');
          let jThis = $(this);

          let result = confirm(
            '루틴 삭제 시 복구 할 수 없습니다.\n삭제하시겠습니까?'
          );

          if (result) {
            axios({
              url: baseUrl + '/routain/delete_routain',
              method: 'delete',
              headers: {
                Authorization: `Bearer ${token}`
              },
              data: {
                id
              }
            }).then((res) => {
              if (res.data.code === 'SUCCESS') {
                alert('루틴이 성공적으로 삭제되었습니다.');
                jThis.parent().remove();
              }
            });
          } else {
            return;
          }
        });

        jRoutain
          .find('.routain-modify')
          .on('click', { id: routain.id, name: routain.name }, function (e) {
            $('.routain-modify-name').val(e.data.name);
            $('.routain-modify-save').attr('id', e.data.id);

            // atom list 불러오기
            axios({
              url: baseUrl + '/atom/get_atom_list',
              method: 'get',
              headers: {
                Authorization: `Bearer ${token}`
              }
            }).then(async (res) => {
              if (res.data.code === 'SUCCESS') {
                let alreadyCheckedAtomIdList = undefined;

                // 이미 루틴에 속한 아톰에 체크
                await axios({
                  url: baseUrl + '/routain/get_routain',
                  method: 'post',
                  headers: {
                    Authorization: `Bearer ${token}`
                  },
                  data: {
                    id: e.data.id
                  }
                }).then((res) => {
                  if (res.data.code === 'SUCCESS') {
                    let routain = res.data.data.routain;
                    let routainAtomIdList = routain.atomOrderString;

                    if (routainAtomIdList != undefined) {
                      routainAtomIdList.split(',').map(Number);
                      alreadyCheckedAtomIdList = routainAtomIdList;
                    }
                  }
                });

                let atomList = res.data.data.totalAtomList;

                // atomlist 가 비어있으면
                if (atomList.length == 0) {
                  $('.routain-modify-no-atoms').show();
                } else {
                  // 아톰 리스트가 비어있지 않으면
                  let jAtomList = $('.routain-modify-atom-list').empty();

                  for (let i in atomList) {
                    let atom = atomList[i];
                    let type = atom.type;

                    let jAtom = $(
                      '<div class="form-check routain-modify-atom-list-item">' +
                        `<input class="form-check-input routain-modify-atom-list-item-checkbox" name="routain-modify-atom-list-item-checkbox" type="checkbox" value=${atom.id} id="flexCheckDefault"/>` +
                        `<label class="form-check-label" for="flexCheckDefault">${atom.text}</label>` +
                        '</div>'
                    );

                    // 이미 루틴에 있는 아톰이라면 체크한
                    if (alreadyCheckedAtomIdList.indexOf(atom.id) > -1) {
                      jAtom.find('input').prop('checked', true);
                    }

                    if (type == 'MUST') {
                      jAtom.find('label').css('color', '#d63384');
                    } else {
                      jAtom.find('label').css('color', '#198754');
                    }

                    jAtomList.append(jAtom);
                  }
                }
              } else {
                alert('오류가 발생했습니다.\n관리자에게 문의하세요');
              }
            });
          });

        // add to list
        jRoutainList.append(jRoutain);
      }
    }
  });

  // 루틴 생성 팝업
  // 아톰 목록 불러오기
  $('.routain-create-modal-show').on('click', function () {
    axios({
      url: baseUrl + '/atom/get_atom_list',
      method: 'get',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then((res) => {
      if (res.data.code === 'SUCCESS') {
        let atomList = res.data.data.totalAtomList;

        // atomlist 가 비어있으면
        if (atomList.length == 0) {
          $('.routain-no-atoms').show();
        } else {
          // 아톰 리스트가 비어있지 않으면
          let jAtomList = $('.routain-atom-list').empty();

          for (let i in atomList) {
            let atom = atomList[i];
            let type = atom.type;

            let jAtom = $(
              '<div class="form-check routain-atom-list-item">' +
                `<input class="form-check-input routain-atom-list-item-checkbox" name="routain-atom-list-item-checkbox" type="checkbox" value=${atom.id} id="flexCheckDefault"/>` +
                `<label class="form-check-label" for="flexCheckDefault">${atom.text}</label>` +
                '</div>'
            );

            if (type == 'MUST') {
              jAtom.find('label').css('color', '#d63384');
            } else {
              jAtom.find('label').css('color', '#198754');
            }

            jAtomList.append(jAtom);
          }
        }
      } else {
        alert('오류가 발생했습니다.\n관리자에게 문의하세요');
      }
    });
  });

  // 루틴 생성 팝업 save버튼
  $('#routainModal .routain-save').on('click', function () {
    let routainName = $('.routain-name').val();
    let jAtomCheckList = $(
      'input:checkbox[name="routain-atom-list-item-checkbox"]'
    );
    let atomIdList = [];
    jAtomCheckList.each(function () {
      if (this.checked) {
        atomIdList.push(this.value);
      }
    });

    axios({
      url: baseUrl + '/routain/create_routain',
      method: 'post',
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        name: routainName,
        atomIdList: atomIdList.join(','),
        isUse: false
      }
    }).then((res) => {
      if (res.data.code === 'SUCCESS') {
        alert('루틴이 성공적으로 생성되었습니다.');
      } else {
        alert('오류가 발생했습니다.\n관리자에게 문의하세요');
      }
      $('#routainModal .btn-close').trigger('click');
    });
  });

  // 루틴 수정 팝업 save 버튼
  $('#routainModifyModal .routain-modify-save').on('click', function () {
    let routainId = Number($(this).attr('id'));

    let routainName = $('.routain-modify-name').val();

    if (routainName.trim().length == 0) {
      alert('루틴 이름을 입력하여 주십시오');
      return;
    }

    let jAtomCheckList = $(
      'input:checkbox[name="routain-modify-atom-list-item-checkbox"]'
    );
    let atomIdList = [];
    jAtomCheckList.each(function () {
      if (this.checked) {
        atomIdList.push(this.value);
      }
    });

    axios({
      url: baseUrl + '/routain/update_routain',
      method: 'patch',
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        id: routainId,
        name: routainName,
        atomIdList: atomIdList.join(','),
        isUse: false
      }
    }).then((res) => {
      if (res.data.code === 'SUCCESS') {
        alert('루틴이 성공적으로 수정되었습니다.');
        location.reload();
      } else {
        alert('오류가 발생했습니다.\n관리자에게 문의하세요');
      }
      $('#routainModifyModal .btn-close').trigger('click');
    });
  });
}

function navBarInit() {
  $('#nav-button-box').show();

  const signUpBtn = $('#signUpModal #btn-signup');
  const loginBtn = $('#loginModal #btn-login');

  // 로그인 팝업 에서 로그인 클릭 시
  loginBtn.on('click', function () {
    const userId = $('#login-user-id').val();
    const passcode = $('#login-user-passcode').val();

    axios
      .post(baseUrl + '/auth/signin', {
        id: userId,
        passcode: passcode
      })
      .then(function (response) {
        let data = response.data;

        localStorage.setItem('HoopsToken', data.data.token);

        alert('로그인에 성공했습니다!');
        $('#loginModal .btn-close').trigger('click');
        location.reload();
        return;
      })
      .catch(function (error) {
        alert('오류가 발생했습니다.');
        $('#loginModal .btn-close').trigger('click');
      });
  });

  // 회원가입 팝업에서 회원가입 클릭 시
  signUpBtn.on('click', function () {
    const userId = $('#signup-user-id').val();
    const userName = $('#signup-user-name').val();
    const passcode = $('#signup-user-passcode').val();
    const passcodeConfirm = $('#signup-user-passcode-confirm').val();

    if (userId.trim().length == 0) {
      alert('아이디를 확인하여 주십시오');
      return;
    }

    if (userName.trim().length == 0) {
      alert('이름을 확인하여 주십시오');
      return;
    }

    if (passcode.trim().length == 0) {
      alert('비밀번호를 확인하여 주십시오');
      return;
    }

    if (passcodeConfirm.trim().length == 0) {
      alert('비밀번호 확인란을 확인하여 주십시오');
      return;
    }

    if (passcode !== passcodeConfirm) {
      alert('비밀번호 확인과 비밀번호가 다릅니다.');
      return;
    }

    axios
      .post(baseUrl + '/auth/signup', {
        id: userId,
        passcode: passcode,
        name: userName
      })
      .then(function (response) {
        let data = response.data;
        let status = data.status;
        let code = data.code;

        if (code === 'SUCCESS') {
          alert('회원가입에 성공했습니다. 로그인 해 주세요.');
          $('#signUpModal .btn-close').trigger('click');
          return;
        }
      })
      .catch(function (error) {
        alert('오류가 발생했습니다.');
        $('#signUpModal .btn-close').trigger('click');
      });
  });
}
