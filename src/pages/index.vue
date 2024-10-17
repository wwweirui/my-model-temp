<script setup lang="ts">
import { createImgCode, sendSms, institution, getDictByKey, referrer, competitionProducts, register, validPhoneCode } from '@/api'
import { showToast, showFailToast, showLoadingToast } from 'vant'
import type {
  PickerConfirmEventParams,
} from 'vant';


onMounted(() => {
  getDictByKey().then(res => {
    if (res.code == 200) {
      columns.value = res.data.dictList;
    }
  })
})

const formRef = ref(null);
const verificationCode = ref('')

const formData = ref({
  associationRegistrationNumber: '123',
  fullInstitutionName: '123',
  contactPersonName: '123',
  contactPersonPhone: '18500001927',
  referrerName: '123',
  // referrerBranchCode: '',
  referrerBranch: '123',
  promiseRead: '0',
  agreed: false,
});
const products = ref([
  {
    productFullName: '123',
    productCode: '123',
    establishmentDate: '',
    strategyGroup: '',
  }
])

const customFieldName = {
  text: 'dictValue',
  value: 'dictKey',
};

const uuid = ref('');
const addProduct = () => {
  products.value.push({
    productFullName: '',
    productCode: '',
    establishmentDate: '',
    strategyGroup: '',
  });
};

const removeProduct = () => {
  // 至少保留一个产品
  if(products.value.length > 1) {
    products.value.pop();
  }
};

const onSubmit = async (values: any) => {
  // submit 报名页面
  // console.log('submit', values);

  if(!formData.value.agreed) {
    showToast('请阅读参赛承诺书')
    return
  }

  
  // 校验短信验证码
  let params = {
    customerType: '2',
    imageCode: captchaCode.value,
    mobileNo: formData.value.contactPersonPhone,
    uuid: uuid.value,
    smsCode: verificationCode.value,
  }
  // const {code, msg} = await validPhoneCode(params)
  let code = 200, msg = '123';
  if(code == 200) {
    // 验证码校验成功 报名数据提交
    
    // 产品重复校验  products 重复处理
    const hasDuplicates = products.value.some((product) => {
      return products.value.filter((p) => p.productFullName === product.productFullName).length > 1;
    });
    if(hasDuplicates) {
      showFailToast('参赛产品重复')
    } else{
      formData.value.promiseRead = '1';
      let paramsSubmit = {
        institution: {...formData.value},
        products: products.value
      }
      const { code, msg} =  await register(paramsSubmit);
      if(code == 200) {
        showToast('报名成功')
      } else {
        showFailToast(msg || '报名失败')
      }
    }



  } else {
    showFailToast(msg || '短信验证码错误')
    verificationCode.value = '';
  }

  

  
  // register(params).then(res => {
  //   res
  // })

};

const openDialog = () => {
  // 验证码校验前
  if (formData.value.contactPersonPhone && validateTel(formData.value.contactPersonPhone)) {
    showDialog.value = true;
    captchaCode.value = '';
    getImgUr();
  } else {
    showFailToast('请填写联系人手机号')
  }
}

const getImgUr = async () => {
  picloading.value = true;
  uuid.value = generateUUID();
  const { data } = await createImgCode({ uuid: uuid.value });
  captchaSrc.value = `data:image/png;base64,${data}`;
  picloading.value = false;
}

// 验证码弹窗逻辑
const showDialog = ref(false);
const captchaSrc = ref(''); // 假设这是后端提供的验证码接口
const captchaCode = ref('');
const picloading = ref<boolean>(false)

const refreshCaptcha = async () => {
  await getImgUr();
};


const sendBtnMessage = ref('获取验证码');
const isSending = ref(false);

let countdown = 60;
let timer: NodeJS.Timeout | null = null;
const sendSmsCodeTime = async () => {
  isSending.value = true;
  sendBtnMessage.value = `${countdown}秒后重发`;
  timer = setInterval(() => {
    countdown--;
    sendBtnMessage.value = `${countdown}秒后重发`;
    if (countdown <= 0) {
      clearInterval(timer!);
      isSending.value = false;
      sendBtnMessage.value = '获取验证码';
      countdown = 60; // 重置倒计时
    }
  }, 1000);
};


const handleBeforeClose = async (action: string) => {
  if (action === 'confirm') {
    if (!captchaCode.value) {
      showFailToast('请输入图形验证码')
      return false
    } else {
      // 确认按钮的逻辑，通常需要向后端发送验证码进行验证
      const params = {
        customerType: '2',
        imageCode: captchaCode.value,
        mobileNo: formData.value.contactPersonPhone,
        uuid: uuid.value
      };
      try {
        const { code, msg } = await sendSms(params)
        if (code == 530009) {   // 号码错误
          showToast(msg || '请求错误')
          return true;
        }
        if (code == 200) {   // 成功
          sendSmsCodeTime();
          return true;
        } else {
          showToast(msg || '请求错误')
          getImgUr()
          captchaCode.value = '';
          return false;
        }
      } catch (err) {
        console.log(err);
        // getImgUr()
        return false;
      }

    }
  } else {
    return true;
  }
};

// 日期
const showPicker = ref(false);
const minDate = new Date(2000, 0, 1);
const maxDate = new Date();
const onConfirmEstablishmentDate = ({ selectedValues }) => {
  products.value[productIndex.value].establishmentDate = selectedValues.join('-');
  showPicker.value = false;
};

// 策略组别
const showPicker2 = ref(false);
const columns = ref([]);
const onConfirmStrategyGroup = ({ selectedOptions }) => { 
   
  products.value[productIndex.value].strategyGroup = selectedOptions[0]?.dictValue;
  showPicker2.value = false;
};


// 
const showReferrerNamePicker = ref(false)
const searchLoading = ref(false)
// 联动逻辑
const showSearchPicker = ref<boolean>(false);
// 下拉框选择的值
const keyvalue = ref('')
const filterdepartments = ref([]);

const timerTT = ref<NodeJS.Timeout | null>(null);

const handleInput = (type: string) => {
  // 清除之前的定时器
  if (timerTT.value) {
    clearTimeout(timerTT.value);
  }
  // 设置新的定时器
  timerTT.value = setTimeout(() => {
    // 在定时器结束时执行搜索逻辑
    search(type);
  }, 500); // 设置防抖的时间间隔，例如 300 毫秒
};

// 输入框搜索方法
const search = async (type: string) => {
  let fnobj = {
    'stf_name': referrer,
    'pfmFullName': institution,
    'productName': competitionProducts,
  }
  let fn = fnobj[type];
  const params = {
    [type]: keyvalue.value
  }
  searchLoading.value = true;
  const { data, code, msg } = await fn(params)
  if (code == 200) {
    let resList = data.slice(0, 20);
    resList.unshift({
      [type]: keyvalue.value
    })
    filterdepartments.value = resList.slice(0, 20)
  } else {
    showFailToast(msg || '请求失败')
    filterdepartments.value = [{ [type]: keyvalue.value }]
  }
  searchLoading.value = false;
}
// 弹窗方法
const onConfirmSocial = (value: PickerConfirmEventParams) => {
  let resValue = value.selectedValues[0] as string;
  if(resValue) {
    formData.value.fullInstitutionName = resValue;
    formData.value.associationRegistrationNumber = filterdepartments.value.find(item => item.pfmFullName == resValue)['amacManagerId']
  }
  showSearchPicker.value = false;
}

const onConfirmReferrer = (value: PickerConfirmEventParams) => {
  let resValue = value.selectedValues[0] as string;
  if(resValue) {
    formData.value.referrerName = resValue;
    formData.value.referrerBranch = filterdepartments.value.find(item => item.stf_name == resValue)['branch_name']
  }
  showReferrerNamePicker.value = false;
}

const clickFullName = () => {
  showSearchPicker.value = true
  searchPickerReset()
}
const clickReferrerName = () => {
  showReferrerNamePicker.value = true
  searchPickerReset()
}

const clickProductFullName = (index: number) => {
  productIndex.value = index;
  showProductFullNamePicker.value = true
  searchPickerReset()
}

const searchPickerReset = () => {
  keyvalue.value = '';
  filterdepartments.value = [];
}

const productIndex = ref();

// 产品信息填写
const showProductFullNamePicker = ref(false);
const onConfirmProduct = (value: PickerConfirmEventParams) => {
  let resValue = value.selectedValues[0] as string;
  if(resValue) {
    products.value[productIndex.value].productFullName = resValue;
    let finditem = filterdepartments.value.find(item => item.productName == resValue)
    products.value[productIndex.value].productCode = finditem['productCode']
    products.value[productIndex.value].establishmentDate = finditem['establishDate']
  }
  showProductFullNamePicker.value = false;
}

// 验证手机号
const validateTel = (val: string) => {
  // 手机号正则表达式，根据需要可能有所变化
  const telRegex = /^1[3456789]\d{9}$/;
  return telRegex.test(val)
};

// 生成uuid
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

</script>

<template>
  <van-form @submit="onSubmit" ref="formRef" validate-trigger="onChange" required label-width="110px">
    <van-cell-group title='参赛机构'>
      <van-field v-model="formData.fullInstitutionName" clickable readonly autocomplete="off" name="机构全称" label="机构全称"
        placeholder="请输入机构全称" @click="clickFullName()" :rules="[{ required: true, message: '请填写机构全称', }]" />
      <van-popup v-model:show="showSearchPicker" position="bottom">
        <van-field v-model.trim="keyvalue" clearable autocomplete="off" left-icon="search" placeholder="搜索机构"
          @input="handleInput('pfmFullName')"></van-field>
        <van-picker show-toolbar :loading="searchLoading"
          :columns-field-names="{ text: 'pfmFullName', value: 'pfmFullName' }" :columns="filterdepartments"
          @confirm="onConfirmSocial" @cancel="showSearchPicker = false">
        </van-picker>
      </van-popup>

      <van-field v-model="formData.associationRegistrationNumber" autocomplete="off" label="协会登记编号/会员编号"
        placeholder="请输入协会登记编号/会员编号" :rules="[{ required: true, message: '请填写协会登记编号/会员编号' }]" />

      <van-field v-model="formData.contactPersonName" label="联系人姓名" autocomplete="off" placeholder="请输入联系人姓名"
        :rules="[{ required: true, message: '请输入联系人姓名' }]" />

      <van-field v-model="formData.contactPersonPhone" type="tel" autocomplete="off" label="联系人手机号"
        placeholder="请输入联系人手机号"
        :rules="[{ required: true, message: '请输入联系人手机号' }, { validator: validateTel, message: '请输入正确手机号' }]" />

      <van-field v-model="verificationCode" clearable label="短信验证码" autocomplete="off" placeholder="请输入短信验证码"
        :rules="[{ required: true, message: '请输入短信验证码' }]">
        <template #button>
          <van-button size="small" type="primary" @click="openDialog" :disabled="isSending">
            {{ sendBtnMessage }}
          </van-button>
        </template>
      </van-field>

      <van-field v-model="formData.referrerName" label="推荐人" clickable readonly placeholder="请输入推荐人"
        :rules="[{ required: true, message: '请输入推荐人' }]" @click="clickReferrerName()" />
      <van-popup v-model:show="showReferrerNamePicker" position="bottom">
        <van-field v-model.trim="keyvalue" clearable autocomplete="off" left-icon="search" placeholder="搜索推荐人"
          @input="handleInput('stf_name')"></van-field>
        <van-picker show-toolbar :loading="searchLoading" :columns-field-names="{ text: 'stf_name', value: 'stf_name' }"
          :columns="filterdepartments" @confirm="onConfirmReferrer" @cancel="showReferrerNamePicker = false">
        </van-picker>
      </van-popup>

      <van-field v-model="formData.referrerBranch" label="推荐单位" autocomplete="off" placeholder="请输入推荐单位"
        :rules="[{ required: true, message: '请输入推荐单位' }]" />
    </van-cell-group>

    <van-cell-group title='参赛产品' class="pb-15px">
      <div v-for="(product, index) in products" :key="index">
        <van-tag type="primary" size="medium" class="mt-10px">{{ `参赛产品${index + 1}` }}</van-tag>
        <van-field v-model="product.productFullName" label="产品全称" readonly clearable placeholder="请输入产品全称"
          :rules="[{ required: true, message: '请输入产品全称' }]"  @click="clickProductFullName(index)"/>
        <van-popup v-model:show="showProductFullNamePicker" position="bottom">
          <van-field v-model.trim="keyvalue" clearable autocomplete="off" left-icon="search" placeholder="搜索产品"
            @input="handleInput('productName')"></van-field>
          <van-picker show-toolbar :loading="searchLoading" :columns-field-names="{ text: 'productName', value: 'productName' }"
            :columns="filterdepartments" @confirm="onConfirmProduct" @cancel="showProductFullNamePicker = false">
          </van-picker>
        </van-popup>

        <van-field v-model="product.productCode" label="产品备案编号" autocomplete="off" placeholder="请输入产品备案编号"
          :rules="[{ required: true, message: '请输入编号' }]" />
        <van-field v-model="product.establishmentDate" is-link readonly name="datePicker" label="成立日期"
          :rules="[{ required: true, message: '请选择成立日期' }]" placeholder="点击选择日期" @click="showPicker = true; productIndex = index" />
        <van-popup v-model:show="showPicker" position="bottom">
          <van-date-picker :min-date="minDate" :max-date="maxDate" @confirm="onConfirmEstablishmentDate"
            @cancel="showPicker = false" />
        </van-popup>

        <van-field v-model="product.strategyGroup" is-link readonly name="picker" label="策略组别" placeholder="点击选择策略"
          :rules="[{ required: true, message: '请选择策略' }]" @click="showPicker2 = true; productIndex = index" />
        <van-popup v-model:show="showPicker2" position="bottom">
          <van-picker :columns="columns" :columns-field-names="customFieldName"
            @confirm="onConfirmStrategyGroup" @cancel="showPicker2 = false" />
        </van-popup>
      </div>

      <div class="flex justify-end mt-10px">
        <van-button style="margin-right: 10px;" type="primary" size="small" @click="addProduct">添加参赛产品</van-button>
        <van-button v-show="products.length > 1" style="margin-right: 15px;" type="danger" size="small" @click="removeProduct">删除</van-button>
      </div>


    </van-cell-group>
    <div class="m-10px flex justify-center">
      <van-checkbox v-model="formData.agreed" icon-size="14px">我已阅读</van-checkbox>
      <span class="decoration-underline 2px">《参赛承诺书》</span>
    </div>
    <div class="m-16px text-center">
      <van-button round block type="primary" native-type="submit">
        提交
      </van-button>
    </div>
  </van-form>

  <!-- 图片验证 -->
  <van-dialog v-model:show="showDialog" show-cancel-button title="图片验证" :before-close="handleBeforeClose">
    <div class="captcha-container">
      <!-- <van-loading type="spinner" color="#1989fa" size="24px" v-if="picloading" /> -->
      <img :src="captchaSrc" @click="refreshCaptcha" alt="验证码" />
      <van-field v-model="captchaCode" autocomplete="off" placeholder="请输入验证码" />
    </div>
  </van-dialog>

</template>

<style scoped>
.captcha-container {
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}
</style>

<route lang="json">{
  "name": "private",
  "meta": {
    "title": "私募大赛"
  }
}</route>
