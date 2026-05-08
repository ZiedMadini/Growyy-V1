import os, logging
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
log = logging.getLogger(__name__)

from transformers import AutoModelForImageClassification, AutoImageProcessor
cache = r'D:\hf_cache\hub'
model_id = 'rescu/deit-base-patch16-224-finetuned-plantvillage'
log.info('Downloading %s to %s ...', model_id, cache)
proc = AutoImageProcessor.from_pretrained(model_id, cache_dir=cache)
log.info('Processor downloaded')
model = AutoModelForImageClassification.from_pretrained(model_id, cache_dir=cache)
log.info('Model downloaded — %d classes', len(model.config.id2label))
log.info('DONE: Disease model ready at D:/hf_cache/hub')
